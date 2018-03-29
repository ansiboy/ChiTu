namespace chitu {
    function combinePath(path1: string, path2: string): string {
        if (!path1) throw Errors.argumentNull('path1');
        if (!path2) throw Errors.argumentNull('path2');

        path1 = path1.trim();
        if (!path1.endsWith('/'))
            path1 = path1 + '/';

        return path1 + path2;
    }




}


