<%@ WebHandler Language="C#" Class="ChiTu" %>
using System;
using System.Web;
using System.IO;
using System.Diagnostics;
using System.Text;

public class ChiTu : IHttpHandler
{
    public void ProcessRequest(HttpContext context)
    {
        var license =
@"
/*
 * ChiTu v1.0.0
 * This software license is under GPL and Ms-PL.
 * Copyright (c) @date Shu Mai
 *
 */
";

        license = license.Replace("@date", DateTime.Now.ToString("yyyy-MM-dd"));
        context.Response.ContentType = "text/plain";
        var coreFiles = new[] { "ChiTu.js", "Utility.js", "Error.js", "Extends.js", "PageContainer.js", 
                                "Page.js", "ControllerModule.js", "RouteModule.js", "Application.js" };

        var path = context.Request.MapPath(context.Request.Path);
        var filePath = new FileInfo(path);
        Debug.Assert(filePath.DirectoryName != null);
        var sb = new StringBuilder();

        foreach (var file in coreFiles)
        {
            var path1 = Path.Combine(filePath.DirectoryName, file);
            OutputFile(path1, new StringWriter(sb));
        }

        var scriptBegin =
@"(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'knockout', 'crossroads', 'text'], factory);
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(require(['jquery', 'knockout', 'crossroads', 'text']));
    } else {
        window.chitu = factory($, ko, crossroads);
    }

})(function ($, ko, crossroads) {";

        var scriptEnd =
@"    return chitu;
});";

        context.Response.Write(scriptBegin);
        context.Response.Write(sb.ToString());
        context.Response.Write(scriptEnd);
    }

    void OutputFile(string path1, TextWriter writer)
    {
        if (File.Exists(path1))
        {
            using (TextReader reader = new StreamReader(path1))
            {
                var line = reader.ReadLine();
                while (line != null)
                {
                    writer.WriteLine(line);

                    line = reader.ReadLine();
                }
            }
        }
    }

    public bool IsReusable
    {
        get { return false; }
    }


}