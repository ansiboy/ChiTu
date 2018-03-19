namespace chitu {
    function combinePath(path1: string, path2: string): string {
        if (!path1) throw Errors.argumentNull('path1');
        if (!path2) throw Errors.argumentNull('path2');

        path1 = path1.trim();
        if (!path1.endsWith('/'))
            path1 = path1 + '/';

        return path1 + path2;
    }

    export function loadjs(path): Promise<any> {
        // if (modules.length == 0)
        //     return Promise.resolve([]);

        return new Promise<Array<any>>((reslove, reject) => {
            requirejs([path],
                function (result) {
                    reslove(result);
                },
                function (err) {
                    reject(err);
                });
        });
    }


}


