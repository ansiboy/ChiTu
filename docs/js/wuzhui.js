
/*!
 * WUZHUI v1.1
 * https://github.com/ansiboy/WuZhui
 *
 * Copyright (c) 2016-2018, shu mai <ansiboy@163.com>
 * Licensed under the MIT License.
 *
 */
var wuzhui;
(function (wuzhui) {
    const CONTROL_DATA_NAME = 'Control';
    class Control {
        constructor(element) {
            if (!element)
                throw wuzhui.Errors.argumentNull('element');
            this._element = element;
            wuzhui.ElementHelper.data(element, CONTROL_DATA_NAME, this);
        }
        get visible() {
            return wuzhui.ElementHelper.isVisible(this._element);
        }
        set visible(value) {
            if (value) {
                wuzhui.ElementHelper.showElement(this._element);
            }
            else {
                wuzhui.ElementHelper.hideElement(this._element);
            }
        }
        get element() {
            return this._element;
        }
        appendChild(child, index) {
            if (child == null)
                throw wuzhui.Errors.argumentNull('child');
            let childElement;
            if (child instanceof Control)
                childElement = child.element;
            else
                childElement = child;
            let placeChild;
            if (index != null) {
                placeChild = this.element.children[index];
            }
            if (placeChild == null) {
                this.element.appendChild(childElement);
            }
            else {
                this.element.insertBefore(childElement, placeChild);
            }
        }
        style(value) {
            wuzhui.applyStyle(this.element, value);
        }
        static getControlByElement(element) {
            return wuzhui.ElementHelper.data(element, CONTROL_DATA_NAME);
        }
    }
    wuzhui.Control = Control;
})(wuzhui || (wuzhui = {}));
var wuzhui;
(function (wuzhui) {
    class DataSource {
        constructor(args) {
            this.inserting = wuzhui.callbacks1(); // { item: T, index: number }
            this.inserted = wuzhui.callbacks1(); //{ item: T, index: number }
            this.deleting = wuzhui.callbacks(); //{ item: T }
            this.deleted = wuzhui.callbacks(); //{ item: T }
            this.updating = wuzhui.callbacks(); //{ item: T }
            this.updated = wuzhui.callbacks(); //{ item: T }
            this.selecting = wuzhui.callbacks(); //{ selectArguments: DataSourceSelectArguments }
            this.selected = wuzhui.callbacks();
            this.error = wuzhui.callbacks();
            this.args = args;
            this.primaryKeys = args.primaryKeys || [];
            this._currentSelectArguments = new DataSourceSelectArguments();
        }
        get canDelete() {
            return this.args.delete != null && this.primaryKeys.length > 0;
        }
        get canInsert() {
            return this.args.insert != null && this.primaryKeys.length > 0;
        }
        get canUpdate() {
            return this.args.update != null && this.primaryKeys.length > 0;
        }
        executeInsert(item) {
            if (!item)
                throw wuzhui.Errors.argumentNull("item");
            return this.args.insert(item);
        }
        executeDelete(item) {
            if (!item)
                throw wuzhui.Errors.argumentNull("item");
            return this.args.delete(item);
        }
        executeUpdate(item) {
            if (!item)
                throw wuzhui.Errors.argumentNull("item");
            return this.args.update(item);
        }
        executeSelect(args) {
            if (!args)
                throw wuzhui.Errors.argumentNull("args");
            return this.args.select(args);
        }
        get selectArguments() {
            return this._currentSelectArguments;
        }
        insert(item, index) {
            if (!this.canInsert)
                throw wuzhui.Errors.dataSourceCanntInsert();
            this.checkPrimaryKeys(item);
            this.inserting.fire(this, item, index); // fireCallback(this.inserting, this, { item, index });
            return this.executeInsert(item).then((data) => {
                Object.assign(item, data);
                // fireCallback(this.inserted, this, { item, index });
                this.inserted.fire(this, item, index);
                return data;
            }).catch(exc => {
                this.processError(exc, 'insert');
            });
        }
        delete(item) {
            if (!this.canDelete)
                throw wuzhui.Errors.dataSourceCanntDelete();
            this.checkPrimaryKeys(item);
            //fireCallback(this.deleting, this, { item });
            this.deleting.fire(this, item);
            return this.executeDelete(item).then((data) => {
                // fireCallback(this.deleted, this, { item });
                this.deleted.fire(this, item);
                return data;
            }).catch(exc => {
                this.processError(exc, 'delete');
            });
        }
        update(item) {
            if (!this.canUpdate)
                throw wuzhui.Errors.dataSourceCanntUpdate();
            this.checkPrimaryKeys(item);
            // fireCallback(this.updating, this, { item });
            this.updating.fire(this, item);
            return this.executeUpdate(item).then((data) => {
                Object.assign(item, data);
                // fireCallback(this.updated, this, { item });
                this.updated.fire(this, item);
                return data;
            }).catch((exc) => {
                this.processError(exc, 'update');
            });
        }
        isSameItem(theItem, otherItem) {
            if (theItem == null)
                throw wuzhui.Errors.argumentNull('theItem');
            if (otherItem == null)
                throw wuzhui.Errors.argumentNull('otherItem');
            if (theItem != otherItem && this.primaryKeys.length == 0)
                return false;
            if (this.primaryKeys.length > 0) {
                for (let pk of this.primaryKeys) {
                    if (theItem[pk] != otherItem[pk])
                        return false;
                }
            }
            return true;
        }
        checkPrimaryKeys(item) {
            for (let key in item) {
                if (item[key] == null && this.primaryKeys.indexOf(key) >= 0)
                    throw wuzhui.Errors.primaryKeyNull(key);
            }
        }
        select() {
            let args = this.selectArguments;
            wuzhui.fireCallback(this.selecting, this, args);
            return this.executeSelect(args).then((data) => {
                let data_items;
                let result = data;
                let totalRowCount;
                if (Array.isArray(data)) {
                    data_items = data;
                    totalRowCount = data_items.length;
                }
                else if (result.dataItems !== undefined && result.totalRowCount !== undefined) {
                    data_items = data.dataItems;
                    totalRowCount = data.totalRowCount;
                }
                else {
                    throw new Error('Type of the query result is expected as Array or DataSourceSelectResult.');
                }
                this.selected.fire(this, { totalRowCount, dataItems: data_items });
                return data;
            }).catch(exc => {
                this.processError(exc, 'select');
            });
        }
        processError(exc, method) {
            exc.method = method;
            this.error.fire(this, exc);
            if (!exc.handled)
                throw exc;
        }
    }
    wuzhui.DataSource = DataSource;
    class DataSourceSelectArguments {
        constructor() {
            this.startRowIndex = 0;
            this.maximumRows = 2147483647;
        }
    }
    wuzhui.DataSourceSelectArguments = DataSourceSelectArguments;
})(wuzhui || (wuzhui = {}));
var wuzhui;
(function (wuzhui) {
    class Errors {
        constructor(parameters) {
        }
        static notImplemented(message) {
            message = message || "Not implemented";
            return new Error(message);
        }
        static argumentNull(paramName) {
            return new Error("Argument '" + paramName + "' can not be null.");
        }
        static controllBelonsAnother() {
            return new Error("The control is belongs another control.");
        }
        static columnsCanntEmpty() {
            return new Error("Columns cannt empty.");
        }
        static dataSourceCanntInsert() {
            return new Error("DataSource can not insert.");
        }
        static dataSourceCanntUpdate() {
            return new Error("DataSource can not update.");
        }
        static dataSourceCanntDelete() {
            return new Error("DataSource can not delete.");
        }
        static primaryKeyNull(key) {
            let msg = `Primary key named '${key}' value is null.`;
            return new Error(msg);
        }
    }
    wuzhui.Errors = Errors;
})(wuzhui || (wuzhui = {}));
var wuzhui;
(function (wuzhui) {
    var GridViewRowType;
    (function (GridViewRowType) {
        GridViewRowType[GridViewRowType["Header"] = 0] = "Header";
        GridViewRowType[GridViewRowType["Footer"] = 1] = "Footer";
        GridViewRowType[GridViewRowType["Data"] = 2] = "Data";
        GridViewRowType[GridViewRowType["Paging"] = 3] = "Paging";
        GridViewRowType[GridViewRowType["Empty"] = 4] = "Empty";
    })(GridViewRowType = wuzhui.GridViewRowType || (wuzhui.GridViewRowType = {}));
    function findParentElement(element, parentTagName) {
        console.assert(element != null);
        console.assert(parentTagName != null);
        parentTagName = parentTagName.toUpperCase();
        let p = element.parentElement;
        while (p) {
            if (p.tagName == parentTagName)
                return p;
            p = p.parentElement;
        }
    }
    class GridViewRow extends wuzhui.Control {
        constructor(rowType) {
            let element = document.createElement('tr');
            super(element);
            this._rowType = rowType;
        }
        get rowType() {
            return this._rowType;
        }
        get gridView() {
            if (this._gridView == null) {
                let gridViewElement = findParentElement(this.element, 'table');
                console.assert(gridViewElement != null);
                this._gridView = wuzhui.Control.getControlByElement(gridViewElement);
                console.assert(this._gridView != null);
            }
            return this._gridView;
        }
        get cells() {
            let cells = new Array();
            for (let i = 0; i < this.element.cells.length; i++) {
                let cell = wuzhui.Control.getControlByElement(this.element.cells[i]);
                console.assert(cell != null);
                cells[i] = cell;
            }
            return cells;
        }
    }
    wuzhui.GridViewRow = GridViewRow;
    class GridViewDataRow extends GridViewRow {
        constructor(gridView, dataItem) {
            super(GridViewRowType.Data);
            this._dataItem = dataItem;
            for (var i = 0; i < gridView.columns.length; i++) {
                var column = gridView.columns[i];
                var cell = column.createItemCell(dataItem);
                cell.visible = column.visible;
                this.appendChild(cell);
            }
        }
        get dataItem() {
            return this._dataItem;
        }
    }
    wuzhui.GridViewDataRow = GridViewDataRow;
    class GridView extends wuzhui.Control {
        constructor(params) {
            super(params.element || document.createElement('table'));
            this.emptyDataHTML = '暂无记录';
            this.initDataHTML = '数据正在加载中...';
            this.loadFailHTML = '加载数据失败，点击重新加载。';
            //========================================================
            // 样式
            // headerStyle: string;
            // footerStyle: string;
            // rowStyle: string;
            // alternatingRowStyle: string;
            //private emptyDataRowStyle: string;
            //========================================================
            this.rowCreated = wuzhui.callbacks();
            params = Object.assign({
                showHeader: true, showFooter: false,
                allowPaging: false
            }, params);
            this._params = params;
            this._columns = params.columns || [];
            if (this._columns.length == 0)
                throw wuzhui.Errors.columnsCanntEmpty();
            for (var i = 0; i < this._columns.length; i++) {
                var column = this._columns[i];
                column.gridView = this;
            }
            this._dataSource = params.dataSource;
            this._dataSource.selected.add((sender, e) => this.on_selectExecuted(e.dataItems));
            this._dataSource.updated.add((sender, item) => this.on_updateExecuted(item));
            this._dataSource.inserted.add((sender, item, index) => this.on_insertExecuted(item, index));
            this._dataSource.deleted.add((sender, item) => this.on_deleteExecuted(item));
            this._dataSource.selecting.add((sender, e) => {
                let display = this._emtpyRow.element.style.display;
                if (display != 'none') {
                    this._emtpyRow.element.cells[0].innerHTML = this.initDataHTML;
                }
            });
            this._dataSource.error.add((sender, e) => {
                if (e.method == 'select') {
                    this.on_selectExecuted([]);
                    var element = this._emtpyRow.cells[0].element;
                    element.innerHTML = this.loadFailHTML;
                    element.onclick = () => {
                        this._dataSource.select();
                    };
                    e.handled = true;
                    console.error(e.message);
                    console.log(e.stack);
                }
            });
            if (params.showHeader) {
                this._header = new wuzhui.Control(document.createElement('thead'));
                this.appendChild(this._header);
                this.appendHeaderRow();
            }
            this.emptyDataHTML = params.emptyDataHTML || this.emptyDataHTML;
            this.initDataHTML = params.initDataHTML || this.initDataHTML;
            this._body = new wuzhui.Control(document.createElement('tbody'));
            this.appendChild(this._body);
            this.appendEmptyRow();
            let allowPaging = params.pageSize;
            if (params.showFooter || allowPaging) {
                this._footer = new wuzhui.Control(document.createElement('tfoot'));
                this.appendChild(this._footer);
                if (params.showFooter)
                    this.appendFooterRow();
                if (allowPaging) {
                    this.createPagingBar(params.pagerSettings);
                    this.dataSource.selectArguments.maximumRows = params.pageSize;
                }
            }
            this.dataSource.select();
        }
        createPagingBar(pagerSettings) {
            var pagingBarContainer = document.createElement('tr');
            var pagingBarElement = document.createElement('td');
            pagingBarElement.className = GridView.pagingBarClassName;
            pagingBarElement.colSpan = this.columns.length;
            pagingBarContainer.appendChild(pagingBarElement);
            console.assert(this._footer != null);
            this._footer.appendChild(pagingBarContainer);
            new wuzhui.NumberPagingBar({ dataSource: this.dataSource, element: pagingBarElement, pagerSettings });
        }
        get columns() {
            return this._columns;
        }
        get dataSource() {
            return this._dataSource;
        }
        appendEmptyRow() {
            this._emtpyRow = new GridViewRow(GridViewRowType.Empty);
            this._emtpyRow.element.className = GridView.emptyRowClassName;
            let cell = new wuzhui.GridViewCell();
            cell.element.colSpan = this.columns.length;
            // cell.element.innerHTML = this.initDataHTML;
            if (!this._params.emptyDataRowStyle) {
                wuzhui.applyStyle(cell.element, this._params.emptyDataRowStyle);
            }
            this._emtpyRow.appendChild(cell);
            this._body.appendChild(this._emtpyRow);
            wuzhui.fireCallback(this.rowCreated, this, { row: this._emtpyRow });
        }
        appendDataRow(dataItem, index) {
            var row = new GridViewDataRow(this, dataItem);
            row.element.className = GridView.dataRowClassName;
            this._body.appendChild(row, index);
            let cells = row.cells;
            for (let j = 0; j < cells.length; j++) {
                let cell = cells[j];
                if (cell instanceof wuzhui.GridViewDataCell) {
                    let value = dataItem[cell.dataField];
                    if (value !== undefined) {
                        // cell.value = value;
                        cell.render(value);
                        dataItem[cell.dataField] = value;
                    }
                }
            }
            wuzhui.fireCallback(this.rowCreated, this, { row });
            if (this._emtpyRow.element.style.display != 'none')
                this.hideEmptyRow();
            return row;
        }
        on_sort(sender, args) {
            if (this._currentSortCell != null && this._currentSortCell != sender) {
                this._currentSortCell.clearSortIcon();
            }
            this._currentSortCell = sender;
        }
        appendHeaderRow() {
            var row = new GridViewRow(GridViewRowType.Header);
            for (var i = 0; i < this.columns.length; i++) {
                var column = this.columns[i];
                let cell = column.createHeaderCell();
                if (cell instanceof wuzhui.GridViewHeaderCell) {
                    cell.sorting.add((e, a) => this.on_sort(e, a));
                }
                row.appendChild(cell);
                cell.visible = this.columns[i].visible;
            }
            this._header.appendChild(row);
        }
        appendFooterRow() {
            var row = new GridViewRow(GridViewRowType.Footer);
            for (var i = 0; i < this.columns.length; i++) {
                var column = this.columns[i];
                let cell = column.createFooterCell();
                row.appendChild(cell);
                cell.visible = column.visible;
            }
            this._footer.appendChild(row);
        }
        on_selectExecuted(items) {
            var rows = this._body.element.querySelectorAll(`.${GridView.dataRowClassName}`);
            for (let i = 0; i < rows.length; i++)
                this._body.element.removeChild(rows[i]);
            if (items.length == 0) {
                this.showEmptyRow();
                return;
            }
            for (let i = 0; i < items.length; i++) {
                this.appendDataRow(items[i]);
            }
        }
        on_updateExecuted(item) {
            console.assert(item != null);
            for (let i = 0; i < this._body.element.rows.length; i++) {
                let row_element = this._body.element.rows[i];
                let row = wuzhui.Control.getControlByElement(row_element);
                ;
                if (!(row instanceof GridViewDataRow))
                    continue;
                let dataItem = row.dataItem;
                if (!this.dataSource.isSameItem(item, dataItem))
                    continue;
                let cells = row.cells;
                for (let j = 0; j < cells.length; j++) {
                    let cell = cells[j];
                    if (cell instanceof wuzhui.GridViewDataCell) {
                        let value = item[cell.dataField];
                        if (value !== undefined) {
                            // cell.value = value;
                            cell.render(value);
                            dataItem[cell.dataField] = value;
                        }
                    }
                }
                break;
            }
        }
        on_insertExecuted(item, index) {
            if (index == null)
                index = 0;
            this.appendDataRow(item, index);
        }
        on_deleteExecuted(item) {
            let dataRowsCount = 0;
            let rows = this._body.element.rows;
            let dataRows = new Array();
            for (let i = 0; i < rows.length; i++) {
                let row = wuzhui.Control.getControlByElement(rows.item(i));
                if ((row instanceof GridViewDataRow))
                    dataRows.push(row);
            }
            for (let i = 0; i < dataRows.length; i++) {
                let dataRow = dataRows[i];
                if (!this.dataSource.isSameItem(item, dataRow.dataItem))
                    continue;
                dataRow.element.remove();
                if (dataRows.length == 1)
                    this.showEmptyRow();
            }
        }
        showEmptyRow() {
            this._emtpyRow.element.cells[0].innerHTML = this.emptyDataHTML;
            this._emtpyRow.element.style.removeProperty('display');
        }
        hideEmptyRow() {
            this._emtpyRow.element.style.display = 'none';
        }
    }
    GridView.emptyRowClassName = 'empty';
    GridView.dataRowClassName = 'data';
    GridView.pagingBarClassName = 'pagingBar';
    wuzhui.GridView = GridView;
})(wuzhui || (wuzhui = {}));
var wuzhui;
(function (wuzhui) {
    var PagerPosition;
    (function (PagerPosition) {
        PagerPosition[PagerPosition["Bottom"] = 0] = "Bottom";
        PagerPosition[PagerPosition["Top"] = 1] = "Top";
        PagerPosition[PagerPosition["TopAndBottom"] = 2] = "TopAndBottom";
    })(PagerPosition = wuzhui.PagerPosition || (wuzhui.PagerPosition = {}));
    ;
    class PagingBar {
        init(dataSource) {
            if (dataSource == null)
                throw wuzhui.Errors.argumentNull('dataSource');
            this._pageIndex = 0;
            this._dataSource = dataSource;
            var pagingBar = this;
            pagingBar.totalRowCount = 1000000;
            dataSource.selected.add((source, args) => {
                pagingBar._pageSize = dataSource.selectArguments.maximumRows;
                var totalRowCount = args.totalRowCount;
                if (totalRowCount != null && totalRowCount >= 0) {
                    pagingBar.totalRowCount = totalRowCount;
                }
                var startRowIndex = dataSource.selectArguments.startRowIndex;
                if (startRowIndex <= 0)
                    startRowIndex = 0;
                pagingBar._pageIndex = Math.floor(startRowIndex / pagingBar._pageSize);
                pagingBar.render();
            });
            dataSource.deleted.add(function () {
                pagingBar.totalRowCount = pagingBar.totalRowCount - 1;
                pagingBar.render();
            });
            dataSource.inserted.add(function () {
                pagingBar.totalRowCount = pagingBar.totalRowCount + 1;
                pagingBar.render();
            });
        }
        get pageCount() {
            var pageCount = Math.ceil(this.totalRowCount / this.pageSize);
            return pageCount;
        }
        get pageSize() {
            return this._pageSize;
        }
        set pageSize(value) {
            this._pageSize = value;
        }
        get pageIndex() {
            return this._pageIndex;
        }
        set pageIndex(value) {
            this._pageIndex = value;
        }
        get totalRowCount() {
            return this._totalRowCount;
        }
        set totalRowCount(value) {
            this._totalRowCount = value;
        }
        // Virtual Method
        render() {
            throw wuzhui.Errors.notImplemented('The table-row render method is not implemented.');
        }
    }
    wuzhui.PagingBar = PagingBar;
    class NumberPagingBar extends PagingBar {
        // private buttonWrapper: string;
        constructor(params) {
            if (!params.dataSource)
                throw wuzhui.Errors.argumentNull('dataSource');
            if (!params.element)
                throw wuzhui.Errors.argumentNull('element');
            let pagerSettings = Object.assign({
                pageButtonCount: 10,
                firstPageText: '<<',
                lastPageText: '>>',
                nextPageText: '...',
                previousPageText: '...',
                showTotal: true,
            }, params.pagerSettings || {});
            super();
            this.dataSource = params.dataSource;
            this.pagerSettings = pagerSettings;
            this.element = params.element;
            // this.buttonWrapper = params.pagerSettings.buttonWrapper;
            this.numberButtons = new Array();
            this.createButton = this.createPagingButton; //params.createButton || 
            this.createLabel = this.createTotalLabel; //params.createTotal || 
            this.createPreviousButtons();
            this.createNumberButtons();
            this.createNextButtons();
            if (this.pagerSettings.showTotal) {
                this.totalElement = this.createLabel();
                this.totalElement.visible = false;
            }
            this.init(params.dataSource);
        }
        createPagingButton() {
            var pagerSettings = this.pagerSettings;
            let button = document.createElement('a');
            button.href = 'javascript:';
            if (this.pagerSettings.buttonWrapper) {
                let w = document.createElement(this.pagerSettings.buttonWrapper);
                w.appendChild(button);
                this.element.appendChild(w);
            }
            else {
                this.element.appendChild(button);
            }
            let result = {
                _button: button,
                get visible() {
                    let button = this._button;
                    return button.style.display != 'none';
                },
                set visible(value) {
                    let button = this._button;
                    let element = pagerSettings.buttonWrapper ? button.parentElement : button;
                    if (value) {
                        element.style.removeProperty('display');
                    }
                    else {
                        element.style.display = 'none';
                    }
                },
                get pageIndex() {
                    let button = this._button;
                    return new Number(button.getAttribute('pageIndex')).valueOf();
                },
                set pageIndex(value) {
                    let button = this._button;
                    button.setAttribute('pageIndex', value);
                },
                get text() {
                    let button = this._button;
                    return button.innerHTML;
                },
                set text(value) {
                    let button = this._button;
                    button.innerHTML = value;
                },
                get active() {
                    let button = this._button;
                    return button.href != null;
                },
                set active(value) {
                    let button = this._button;
                    if (value == true) {
                        button.removeAttribute('href');
                        if (pagerSettings.activeButtonClassName) {
                            // button.className = pagerSettings.activeButtonClassName;
                            this.setClassName(pagerSettings.activeButtonClassName);
                        }
                        return;
                    }
                    button.href = 'javascript:';
                    if (pagerSettings.buttonClassName)
                        this.setClassName(pagerSettings.buttonClassName); //button.className = pagerSettings.buttonClassName;
                    else
                        this.setClassName(null); // button.removeAttribute('class');
                },
                setClassName(value) {
                    let button = this._button;
                    let element = pagerSettings.buttonWrapper ? button.parentElement : button;
                    if (value)
                        element.className = value;
                    else
                        element.removeAttribute('class');
                },
                onclick: null
            };
            button.onclick = () => {
                if (result.onclick) {
                    result.onclick(result, this);
                }
            };
            return result;
        }
        createTotalLabel() {
            let totalElement = document.createElement('div');
            totalElement.className = 'total';
            let textElement = document.createElement('span');
            textElement.className = 'text';
            textElement.innerHTML = '总记录：';
            totalElement.appendChild(textElement);
            let numberElement = document.createElement('span');
            numberElement.className = 'number';
            totalElement.appendChild(numberElement);
            this.element.appendChild(totalElement);
            return {
                get text() {
                    return numberElement.innerHTML;
                },
                set text(value) {
                    numberElement.innerHTML = value;
                },
                get visible() {
                    let display = totalElement.style.display;
                    return display != 'none';
                },
                set visible(value) {
                    if (value == true)
                        totalElement.style.display = 'block';
                    else
                        totalElement.style.display = 'node';
                }
            };
        }
        createPreviousButtons() {
            this.firstPageButton = this.createButton();
            this.firstPageButton.onclick = NumberPagingBar.on_buttonClick;
            this.firstPageButton.text = this.pagerSettings.firstPageText;
            this.firstPageButton.visible = false;
            this.previousPageButton = this.createButton();
            this.previousPageButton.onclick = NumberPagingBar.on_buttonClick;
            this.previousPageButton.text = this.pagerSettings.previousPageText;
            this.previousPageButton.visible = false;
        }
        createNextButtons() {
            this.nextPageButton = this.createButton();
            this.nextPageButton.onclick = NumberPagingBar.on_buttonClick;
            this.nextPageButton.text = this.pagerSettings.nextPageText;
            this.nextPageButton.visible = false;
            this.lastPageButton = this.createButton();
            this.lastPageButton.onclick = NumberPagingBar.on_buttonClick;
            this.lastPageButton.text = this.pagerSettings.lastPageText;
            this.lastPageButton.visible = false;
        }
        createNumberButtons() {
            let pagingBar = this;
            let buttonCount = this.pagerSettings.pageButtonCount;
            for (let i = 0; i < buttonCount; i++) {
                let button = this.createButton();
                button.onclick = NumberPagingBar.on_buttonClick;
                this.numberButtons[i] = button;
            }
            this.numberButtons.forEach(btn => {
                btn.onclick = () => NumberPagingBar.on_buttonClick(btn, pagingBar);
            });
        }
        static on_buttonClick(button, pagingBar) {
            let pageIndex = button.pageIndex;
            if (!pageIndex == null) {
                return;
            }
            let args = pagingBar.dataSource.selectArguments;
            args.maximumRows = pagingBar.pageSize;
            args.startRowIndex = pageIndex * pagingBar.pageSize;
            pagingBar.pageIndex = pageIndex;
            pagingBar.dataSource.select();
        }
        render() {
            var pagerSettings = this.pagerSettings;
            var buttonCount = pagerSettings.pageButtonCount;
            let pagingBarIndex = Math.floor(this.pageIndex / buttonCount);
            let pagingBarCount = Math.ceil(this.pageCount / buttonCount);
            this.previousPageButton.pageIndex = (pagingBarIndex - 1) * buttonCount;
            this.nextPageButton.pageIndex = (pagingBarIndex + 1) * buttonCount;
            this.firstPageButton.pageIndex = 0;
            this.lastPageButton.pageIndex = this.pageCount - 1;
            for (let i = 0; i < this.numberButtons.length; i++) {
                let pageIndex = pagingBarIndex * buttonCount + i;
                if (pageIndex < this.pageCount) {
                    this.numberButtons[i].pageIndex = pageIndex;
                    this.numberButtons[i].text = (pagingBarIndex * buttonCount + i + 1).toString();
                    this.numberButtons[i].visible = true;
                    this.numberButtons[i].active = pageIndex == this.pageIndex;
                }
                else {
                    this.numberButtons[i].visible = false;
                }
            }
            if (this.totalElement) {
                this.totalElement.text = this.totalRowCount;
                this.totalElement.visible = true;
            }
            this.firstPageButton.visible = false;
            this.previousPageButton.visible = false;
            this.lastPageButton.visible = false;
            this.nextPageButton.visible = false;
            if (pagingBarIndex > 0) {
                this.firstPageButton.visible = true;
                this.previousPageButton.visible = true;
            }
            if (pagingBarIndex < pagingBarCount - 1) {
                this.lastPageButton.visible = true;
                this.nextPageButton.visible = true;
            }
        }
    }
    wuzhui.NumberPagingBar = NumberPagingBar;
})(wuzhui || (wuzhui = {}));
var wuzhui;
(function (wuzhui) {
    class ElementHelper {
        static showElement(element) {
            if (!element)
                throw wuzhui.Errors.argumentNull('element');
            element.style.removeProperty('display');
        }
        static hideElement(element) {
            if (!element)
                throw wuzhui.Errors.argumentNull('element');
            element.style.display = 'none';
        }
        static isVisible(element) {
            let { display } = element.style;
            return !display || display != 'none';
        }
        static data(element, name, value) {
            element['data'] = element['data'] || {};
            if (value == null)
                return element['data'].name;
            element['data'].name = value;
        }
        static findFirstParentByTagName(element, tagName) {
            if (element == null)
                throw wuzhui.Errors.argumentNull("element");
            if (!tagName)
                throw wuzhui.Errors.argumentNull('tagName');
            let parent = element.parentElement;
            while (parent != null) {
                if (parent.tagName.toLowerCase() == tagName.toLowerCase()) {
                    return parent;
                }
                parent = parent.parentElement;
            }
            return null;
        }
    }
    wuzhui.ElementHelper = ElementHelper;
    function applyStyle(element, value) {
        let style = value || '';
        if (typeof style == 'string') {
            element.setAttribute('style', style);
        }
        else {
            for (let key in style) {
                element.style[key] = style[key];
            }
        }
    }
    wuzhui.applyStyle = applyStyle;
    class Callback {
        constructor() {
            this.funcs = new Array();
        }
        add(func) {
            this.funcs.push(func);
        }
        remove(func) {
            this.funcs = this.funcs.filter(o => o != func);
        }
        fire(...args) {
            this.funcs.forEach(o => o(...args));
        }
    }
    wuzhui.Callback = Callback;
    function callbacks() {
        return new Callback();
    }
    wuzhui.callbacks = callbacks;
    function callbacks1() {
        return new Callback();
    }
    wuzhui.callbacks1 = callbacks1;
    function fireCallback(callback, ...args) {
        callback.fire(...args);
    }
    wuzhui.fireCallback = fireCallback;
})(wuzhui || (wuzhui = {}));
/// <reference path="../Control.ts"/>
var wuzhui;
(function (wuzhui) {
    class GridViewCell extends wuzhui.Control {
        constructor() {
            super(document.createElement('td'));
        }
    }
    wuzhui.GridViewCell = GridViewCell;
    class GridViewDataCell extends GridViewCell {
        constructor(params) {
            super();
            params = params || {};
            this.nullText = params.nullText != null ? params.nullText : '';
            this.dataFormatString = params.dataFormatString;
            this.dataField = params.dataField;
            if (params.render) {
                this.render = params.render;
            }
        }
        render(value) {
            var text;
            if (value == null)
                text = this.nullText;
            else if (this.dataFormatString)
                text = this.formatValue(this.dataFormatString, value);
            else
                text = value;
            this.element.innerHTML = text;
        }
        formatValue(format, arg) {
            var result = '';
            for (var i = 0;;) {
                var open = format.indexOf('{', i);
                var close = format.indexOf('}', i);
                if ((open < 0) && (close < 0)) {
                    result += format.slice(i);
                    break;
                }
                if ((close > 0) && ((close < open) || (open < 0))) {
                    if (format.charAt(close + 1) !== '}') {
                        throw new Error('Sys.Res.stringFormatBraceMismatch');
                    }
                    result += format.slice(i, close + 1);
                    i = close + 2;
                    continue;
                }
                result += format.slice(i, open);
                i = open + 1;
                if (format.charAt(i) === '{') {
                    result += '{';
                    i++;
                    continue;
                }
                if (close < 0)
                    throw new Error('Sys.Res.stringFormatBraceMismatch');
                var brace = format.substring(i, close);
                // var colonIndex = brace.indexOf(':');
                // var argNumber = parseInt((colonIndex < 0) ? brace : brace.substring(0, colonIndex), 10) + 1;
                // if (isNaN(argNumber))
                //     throw new Error(`string format '${format}' error`);
                // var argFormat = (colonIndex < 0) ? '' : brace.substring(colonIndex + 1);
                var argFormat = brace;
                // var arg = args[argNumber];
                if (typeof (arg) === "undefined" || arg === null) {
                    arg = '';
                }
                if (arg instanceof Date)
                    result = result + this.formatDate(arg, argFormat);
                else if (arg instanceof Number || typeof arg == 'number')
                    result = result + this.formatNumber(arg, argFormat);
                else
                    result = result + arg.toString();
                i = close + 1;
            }
            return result;
        }
        formatDate(value, format) {
            switch (format) {
                case 'd':
                    return `${value.getFullYear()}-${value.getMonth() + 1}-${value.getDate()}`;
                case 'g':
                    return `${value.getFullYear()}-${value.getMonth() + 1}-${value.getDate()} ${value.getHours()}:${value.getMinutes()}`;
                case 'G':
                    return `${value.getFullYear()}-${value.getMonth() + 1}-${value.getDate()} ${value.getHours()}:${value.getMinutes()}:${value.getSeconds()}`;
                case 't':
                    return `${value.getHours()}:${value.getMinutes()}`;
                case 'T':
                    return `${value.getHours()}:${value.getMinutes()}:${value.getSeconds()}`;
            }
            return value.toString();
        }
        formatNumber(value, format) {
            let reg = new RegExp('^C[0-9]+');
            if (reg.test(format)) {
                let num = format.substr(1);
                return value.toFixed(num);
            }
            return value.toString();
        }
    }
    wuzhui.GridViewDataCell = GridViewDataCell;
    class GridViewHeaderCell extends wuzhui.Control {
        constructor(field) {
            super(document.createElement('th'));
            this.ascHTML = '↑';
            this.descHTML = '↓';
            this.sortingHTML = '...';
            this.field = field;
            this.sorting = wuzhui.callbacks();
            this.sorted = wuzhui.callbacks();
            if (field.sortExpression) {
                let labelElement = document.createElement('a');
                labelElement.href = 'javascript:';
                labelElement.innerHTML = this.defaultHeaderText();
                labelElement.onclick = () => this.handleSort();
                this._iconElement = document.createElement('span');
                this.appendChild(labelElement);
                this.appendChild(this._iconElement);
                this.sorting.add(() => this._iconElement.innerHTML = this.sortingHTML);
                this.sorted.add(() => this.updateSortIcon());
            }
            else {
                this.element.innerHTML = this.defaultHeaderText();
            }
            this.style(field.headerStyle);
        }
        handleSort() {
            let selectArguments = this.field.gridView.dataSource.selectArguments;
            let sortType = this.sortType == 'asc' ? 'desc' : 'asc';
            wuzhui.fireCallback(this.sorting, this, { sortType });
            selectArguments.sortExpression = this.field.sortExpression + ' ' + sortType;
            return this.field.gridView.dataSource.select()
                .then(() => {
                this.sortType = sortType;
                wuzhui.fireCallback(this.sorted, this, { sortType });
            });
        }
        defaultHeaderText() {
            return this.field.headerText || this.field.dataField || '';
        }
        get sortType() {
            return this._sortType;
        }
        set sortType(value) {
            this._sortType = value;
        }
        clearSortIcon() {
            this._iconElement.innerHTML = '';
        }
        updateSortIcon() {
            if (this.sortType == 'asc') {
                this._iconElement.innerHTML = '↑';
            }
            else if (this.sortType == 'desc') {
                this._iconElement.innerHTML = '↓';
            }
            else {
                this._iconElement.innerHTML = '';
            }
        }
    }
    wuzhui.GridViewHeaderCell = GridViewHeaderCell;
    class DataControlField {
        constructor(params) {
            if (params.visible == null)
                params.visible = true;
            this._params = params;
        }
        /**
         * Gets the text that is displayed in the footer item of a data control field.
         */
        get footerText() {
            return this._params.footerText;
        }
        /**
         * Sets the text that is displayed in the footer item of a data control field.
         */
        set footerText(value) {
            this._params.footerText = value;
        }
        /**
         * Gets the text that is displayed in the header item of a data control field.
         */
        get headerText() {
            return this._params.headerText;
        }
        /**
        * Sets the text that is displayed in the header item of a data control field.
        */
        set headerText(value) {
            this._params.headerText = value;
        }
        get itemStyle() {
            return this._params.itemStyle;
        }
        set itemStyle(value) {
            this._params.itemStyle = value;
        }
        get footerStyle() {
            return this._params.footerStyle;
        }
        set footerStyle(value) {
            this._params.footerStyle = value;
        }
        get headerStyle() {
            return this._params.headerStyle;
        }
        set headerStyle(value) {
            this._params.headerStyle = value;
        }
        get visible() {
            return this._params.visible;
        }
        get gridView() {
            return this._gridView;
        }
        set gridView(value) {
            this._gridView = value;
        }
        /**
         * Gets a sort expression that is used by a data source control to sort data.
         */
        get sortExpression() {
            return this._params.sortExpression;
        }
        /**
         * Sets a sort expression that is used by a data source control to sort data.
         */
        set sortExpression(value) {
            this._params.sortExpression = value;
        }
        createHeaderCell() {
            let cell = new GridViewHeaderCell(this);
            return cell;
        }
        createFooterCell() {
            let cell = new GridViewCell();
            cell.element.innerHTML = this.footerText || '';
            cell.style(this.footerStyle);
            return cell;
        }
        createItemCell(dataItem) {
            if (!dataItem)
                throw wuzhui.Errors.argumentNull('dataItem');
            let cell = new GridViewCell();
            cell.style(this.itemStyle);
            return cell;
        }
    }
    wuzhui.DataControlField = DataControlField;
})(wuzhui || (wuzhui = {}));
/// <reference path="DataControlField.ts"/>
var wuzhui;
(function (wuzhui) {
    class GridViewEditableCell extends wuzhui.GridViewDataCell {
        constructor(field, dataItem, valueType) {
            if (field == null)
                throw wuzhui.Errors.argumentNull('field');
            if (dataItem == null)
                throw wuzhui.Errors.argumentNull('dataItem');
            super({
                dataField: field.dataField,
                nullText: field.nullText, dataFormatString: field.dataFormatString
            });
            this._field = field;
            this._dataItem = dataItem;
            this._valueType = valueType;
            this._mode = 'read';
            if (!this._valueType) {
                let value = dataItem[field.dataField];
                if (value instanceof Date)
                    this._valueType = 'date';
                else
                    this._valueType = typeof value;
            }
        }
        get field() {
            return this._field;
        }
        get mode() {
            return this._mode;
        }
        beginEdit() {
            if (this._field.readOnly) {
                return;
            }
            this._mode = 'edit';
            let value = this._dataItem[this.field.dataField];
            this.render(value);
        }
        endEdit() {
            if (this._field.readOnly) {
                return;
            }
            this._mode = 'read';
            let value = this.controlValue;
            this._dataItem[this.field.dataField] = value;
            this.render(value);
        }
        cancelEdit() {
            if (this._field.readOnly) {
                return;
            }
            this._mode = 'read';
            let value = this._dataItem[this.field.dataField];
            this.render(value);
        }
        render(value) {
            if (this._mode == 'edit') {
                this.element.innerHTML = `<input type="text" />`;
                wuzhui.applyStyle(this.element.querySelector('input'), this._field.controlStyle);
                this.element.querySelector('input').value =
                    value === undefined ? null : value;
                return;
            }
            super.render(value);
        }
        //==============================================
        // Virtual Methods
        get controlValue() {
            var text = this.element.querySelector('input').value;
            switch (this._valueType) {
                case 'number':
                    return new Number(text).valueOf();
                case 'date':
                    return new Date(text);
                default:
                    return text;
            }
        }
    }
    wuzhui.GridViewEditableCell = GridViewEditableCell;
    class BoundField extends wuzhui.DataControlField {
        constructor(params) {
            super(params);
            this._params = params;
            this._valueElement = document.createElement('span');
        }
        params() {
            return this._params;
        }
        /**
         * Gets the caption displayed for a field when the field's value is null.
         */
        get nullText() {
            return this.params().nullText;
        }
        createItemCell(dataItem) {
            let cell = new GridViewEditableCell(this, dataItem);
            cell.style(this.itemStyle);
            return cell;
        }
        /**
         * Gets the field for the value.
         */
        get dataField() {
            return this.params().dataField;
        }
        /**
         * Gets the string that specifies the display format for the value of the field.
         */
        get dataFormatString() {
            return this.params().dataFormatString;
        }
        get controlStyle() {
            return this.params().controlStyle;
        }
        get readOnly() {
            return this.params().readOnly;
        }
    }
    wuzhui.BoundField = BoundField;
})(wuzhui || (wuzhui = {}));
/// <reference path="DataControlField.ts"/>
var wuzhui;
(function (wuzhui) {
    class GridViewCommandCell extends wuzhui.GridViewCell {
        // cancelAddButton: HTMLElement;
        constructor(field) {
            super();
        }
    }
    class CommandField extends wuzhui.DataControlField {
        constructor(params) {
            super(params);
            // private _updating = false;
            // private _deleting = false;
            this.currentMode = 'read';
            if (!this.params().cancelButtonHTML)
                this.params().cancelButtonHTML = '取消';
            if (!this.params().deleteButtonHTML)
                this.params().deleteButtonHTML = '删除';
            if (!this.params().editButtonHTML)
                this.params().editButtonHTML = '编辑';
            if (!this.params().updateButtonHTML)
                this.params().updateButtonHTML = '更新';
            if (!this.params().newButtonHTML)
                this.params().newButtonHTML = '新增';
            if (!this.params().insertButtonHTML)
                this.params().insertButtonHTML = '添加';
        }
        params() {
            return this._params;
        }
        get cancelButtonHTML() {
            return this.params().cancelButtonHTML;
        }
        get deleteButtonHTML() {
            return this.params().deleteButtonHTML;
        }
        get editButtonHTML() {
            return this.params().editButtonHTML;
        }
        get updateButtonHTML() {
            return this.params().updateButtonHTML;
        }
        get newButtonHTML() {
            return this.params().newButtonHTML;
        }
        get insertButtonHTML() {
            return this.params().insertButtonHTML;
        }
        get cancelButtonClass() {
            return this.params().cancelButtonClass;
        }
        get deleteButtonClass() {
            return this.params().deleteButtonClass;
        }
        get editButtonClass() {
            return this.params().editButtonClass;
        }
        get newButtonClass() {
            return this.params().newButtonClass;
        }
        get updateButtonClass() {
            return this.params().updateButtonClass;
        }
        get insertButtonClass() {
            return this.params().insertButtonClass;
        }
        createItemCell(dataItem) {
            let cell = new GridViewCommandCell(this);
            cell.style(this.itemStyle);
            if (this.params().showEditButton) {
                let editButton = this.createEditButton();
                editButton.style.marginRight = '4px';
                if (this.editButtonClass)
                    editButton.className = this.editButtonClass;
                cell.editButton = editButton;
                editButton.addEventListener('click', (e) => this.on_editButtonClick(e));
                cell.appendChild(editButton);
                let updateButton = this.createUpdateButton();
                updateButton.style.display = 'none';
                updateButton.style.marginRight = '4px';
                if (this.updateButtonClass)
                    updateButton.className = this.updateButtonClass;
                cell.updateButton = updateButton;
                updateButton.addEventListener('click', (e) => this.on_insertOrUpdateButtonClick(e));
                cell.appendChild(updateButton);
                let cancelButton = this.createCancelButton();
                cancelButton.style.display = 'none';
                cancelButton.style.marginRight = '4px';
                if (this.cancelButtonClass)
                    cancelButton.className = this.cancelButtonClass;
                cell.cacelButton = cancelButton;
                cancelButton.addEventListener('click', (e) => this.on_cancelButtonClick(e));
                cell.appendChild(cancelButton);
            }
            if (this.params().showDeleteButton) {
                let deleteButton = this.createDeleteButton();
                deleteButton.style.marginRight = '4px';
                if (this.deleteButtonClass)
                    deleteButton.className = this.deleteButtonClass;
                cell.deleteButton = deleteButton;
                deleteButton.onclick = (e) => this.on_deleteButtonClick(e);
                cell.appendChild(deleteButton);
            }
            if (this.params().showNewButton) {
                let newButton = this.createNewButton();
                newButton.style.marginRight = '4px';
                if (this.newButtonClass)
                    newButton.className = this.newButtonClass;
                newButton.onclick = (e) => this.on_newButtonClick(e);
                cell.newButton = newButton;
                cell.appendChild(newButton);
                let insertButton = this.createInsertButton();
                insertButton.style.display = 'none';
                insertButton.style.marginRight = '4px';
                insertButton.addEventListener('click', (e) => this.on_insertOrUpdateButtonClick(e));
                if (this.insertButtonClass)
                    insertButton.className = this.updateButtonClass;
                cell.insertButton = insertButton;
                cell.appendChild(insertButton);
                let cancelButton = this.createCancelButton();
                cancelButton.style.display = 'none';
                cancelButton.style.marginRight = '4px';
                cancelButton.addEventListener('click', (e) => this.on_cancelButtonClick(e));
                if (this.cancelButtonClass)
                    cancelButton.className = this.cancelButtonClass;
                cell.cacelButton = cancelButton;
                cell.appendChild(cancelButton);
            }
            return cell;
        }
        showReadStatusButtons(cell) {
            if (cell.newButton) {
                this.showButton(cell.newButton);
                this.hideButton(cell.insertButton);
            }
            if (cell.editButton) {
                this.showButton(cell.editButton);
                this.hideButton(cell.updateButton);
            }
            if (cell.deleteButton)
                this.showButton(cell.deleteButton);
            this.hideButton(cell.cacelButton);
        }
        createEditButton() {
            let button = document.createElement('a');
            button.innerHTML = this.editButtonHTML;
            button.href = 'javascript:';
            return button;
        }
        createDeleteButton() {
            let button = document.createElement('a');
            button.innerHTML = this.deleteButtonHTML;
            button.href = 'javascript:';
            return button;
        }
        createInsertButton() {
            let button = document.createElement('a');
            button.innerHTML = this.insertButtonHTML;
            button.href = 'javascript:';
            return button;
        }
        createUpdateButton() {
            let button = document.createElement('a');
            button.innerHTML = this.updateButtonHTML;
            button.href = 'javascript:';
            return button;
        }
        createCancelButton() {
            let button = document.createElement('a');
            button.innerHTML = this.cancelButtonHTML;
            button.href = 'javascript:';
            return button;
        }
        createNewButton() {
            let button = document.createElement('a');
            button.innerHTML = this.newButtonHTML;
            button.href = 'javascript:';
            return button;
        }
        hideButton(button) {
            button.style.display = 'none';
        }
        showButton(button) {
            button.style.removeProperty('display');
        }
        findParentCell(element) {
            let cellElement;
            let p = element.parentElement;
            while (p) {
                if (p.tagName == 'TD') {
                    cellElement = p;
                    break;
                }
                p = p.parentElement;
            }
            return cellElement;
        }
        on_editButtonClick(e) {
            let cellElement = this.findParentCell(e.target);
            console.assert(cellElement != null);
            let rowElement = cellElement.parentElement;
            for (let i = 0; i < rowElement.cells.length; i++) {
                let cell = wuzhui.Control.getControlByElement(rowElement.cells[i]);
                if (cell instanceof wuzhui.GridViewEditableCell) {
                    cell.beginEdit();
                }
            }
            let cell = wuzhui.Control.getControlByElement(cellElement);
            this.showButton(cell.cacelButton);
            this.showButton(cell.updateButton);
            this.hideButton(cell.editButton);
            if (cell.deleteButton)
                this.hideButton(cell.deleteButton);
            if (cell.newButton)
                this.hideButton(cell.newButton);
        }
        on_cancelButtonClick(e) {
            let cellElement = this.findParentCell(e.target);
            console.assert(cellElement != null);
            let rowElement = cellElement.parentElement;
            var row = wuzhui.Control.getControlByElement(rowElement);
            if (row["isNew"] == true) {
                rowElement.remove();
                return;
            }
            for (let i = 0; i < rowElement.cells.length; i++) {
                let cell = wuzhui.Control.getControlByElement(rowElement.cells[i]);
                if (cell instanceof wuzhui.GridViewEditableCell) {
                    cell.cancelEdit();
                }
            }
            let cell = wuzhui.Control.getControlByElement(cellElement);
            this.hideButton(cell.cacelButton);
            this.hideButton(cell.updateButton);
            this.showButton(cell.editButton);
            if (cell.deleteButton)
                this.showButton(cell.deleteButton);
            if (cell.newButton)
                this.showButton(cell.newButton);
        }
        on_insertOrUpdateButtonClick(e) {
            if (e.target['_updating'])
                e.target['_updating'] = true;
            let cellElement = wuzhui.ElementHelper.findFirstParentByTagName(e.target, 'td');
            let rowElement = cellElement.parentElement;
            let cell = wuzhui.Control.getControlByElement(cellElement);
            let row = wuzhui.Control.getControlByElement(rowElement);
            //==========================================================
            // 复制 dataItem 副本
            let dataItem = Object.assign({}, row.dataItem || {});
            //==========================================================
            let dataSource = row.gridView.dataSource;
            let editableCells = new Array();
            for (let i = 0; i < rowElement.cells.length; i++) {
                let cell = wuzhui.Control.getControlByElement(rowElement.cells[i]);
                if (cell instanceof wuzhui.GridViewEditableCell && cell.mode == 'edit') {
                    dataItem[cell.field.dataField] = cell.controlValue;
                    editableCells.push(cell);
                }
            }
            let isInsert = e.target == cell.insertButton;
            let p = isInsert ? dataSource.insert(dataItem, rowElement.rowIndex) : dataSource.update(dataItem);
            return p.then(() => {
                if (isInsert) {
                    rowElement.remove();
                    return;
                }
                editableCells.forEach((item) => item.endEdit());
                let cell = wuzhui.Control.getControlByElement(cellElement);
                this.showReadStatusButtons(cell);
                e.target['_updating'] = false;
            }).catch(() => e.target['_updating'] = false);
        }
        on_deleteButtonClick(e) {
            let rowElement = wuzhui.ElementHelper.findFirstParentByTagName(e.target, "tr");
            let row = wuzhui.Control.getControlByElement(rowElement);
            let dataSource = row.gridView.dataSource;
            dataSource.delete(row.dataItem)
                .then(() => {
                rowElement.remove();
            });
        }
        on_newButtonClick(e) {
            let rowElement = wuzhui.ElementHelper.findFirstParentByTagName(e.target, "tr"); //cellElement.parentElement as HTMLTableRowElement;
            let row = wuzhui.Control.getControlByElement(rowElement);
            let gridView = row.gridView;
            let newRow = gridView.appendDataRow({}, rowElement.rowIndex);
            newRow["isNew"] = true;
            let commandCells = newRow.cells.filter(o => o instanceof GridViewCommandCell);
            newRow.cells.filter(o => o instanceof wuzhui.GridViewEditableCell)
                .forEach((c) => c.beginEdit());
            commandCells.forEach((cell) => {
                if (cell.deleteButton)
                    this.hideButton(cell.deleteButton);
                if (cell.editButton)
                    this.hideButton(cell.editButton);
                this.hideButton(cell.newButton);
                this.showButton(cell.insertButton);
                this.showButton(cell.cacelButton);
            });
        }
    }
    wuzhui.CommandField = CommandField;
})(wuzhui || (wuzhui = {}));
/// <reference path="DataControlField.ts"/>
var wuzhui;
(function (wuzhui) {
    class CustomField extends wuzhui.DataControlField {
        constructor(params) {
            super(params);
        }
        params() {
            return this._params;
        }
        createHeaderCell() {
            if (this.params().createHeaderCell) {
                let cell = this.params().createHeaderCell();
                cell.style(this.headerStyle);
                return cell;
            }
            return super.createHeaderCell();
        }
        createFooterCell() {
            if (this.params().createFooterCell) {
                let cell = this.params().createFooterCell();
                cell.style(this.params().footerStyle);
                return cell;
            }
            return super.createFooterCell();
        }
        createItemCell(dataItem) {
            if (this.params().createItemCell) {
                let cell = this.params().createItemCell(dataItem);
                cell.style(this.params().itemStyle);
                return cell;
            }
            return super.createItemCell(dataItem);
        }
    }
    wuzhui.CustomField = CustomField;
})(wuzhui || (wuzhui = {}));
