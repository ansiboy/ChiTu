namespace chitu {
    export function combinePath(path1: string, path2: string): string {
        if (!path1) throw Errors.argumentNull('path1');
        if (!path2) throw Errors.argumentNull('path2');

        path1 = path1.trim();
        if (!path1.endsWith('/'))
            path1 = path1 + '/';

        return path1 + path2;
    }

    export function loadjs(...modules: string[]): Promise<Array<any>> {
        if (modules.length == 0)
            return Promise.resolve([]);

        return new Promise<Array<any>>((reslove, reject) => {
            requirejs(modules,
                function () {
                    var args = [];
                    for (var i = 0; i < arguments.length; i++)
                        args[i] = arguments[i];

                    reslove(args);
                },
                function () {
                    reject();
                });
        });
    }


}


