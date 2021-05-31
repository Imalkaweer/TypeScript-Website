define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createURLQueryWithCompilerOptions = exports.getCompilerOptionsFromParams = exports.getDefaultSandboxCompilerOptions = void 0;
    /**
     * These are the defaults, but they also act as the list of all compiler options
     * which are parsed in the query params.
     */
    function getDefaultSandboxCompilerOptions(config, monaco) {
        const useJavaScript = config.filetype === "js";
        const settings = {
            noImplicitAny: true,
            strictNullChecks: !useJavaScript,
            strictFunctionTypes: true,
            strictPropertyInitialization: true,
            strictBindCallApply: true,
            noImplicitThis: true,
            noImplicitReturns: true,
            noUncheckedIndexedAccess: false,
            // 3.7 off, 3.8 on I think
            useDefineForClassFields: false,
            alwaysStrict: true,
            allowUnreachableCode: false,
            allowUnusedLabels: false,
            downlevelIteration: false,
            noEmitHelpers: false,
            noLib: false,
            noStrictGenericChecks: false,
            noUnusedLocals: false,
            noUnusedParameters: false,
            esModuleInterop: true,
            preserveConstEnums: false,
            removeComments: false,
            skipLibCheck: false,
            checkJs: useJavaScript,
            allowJs: useJavaScript,
            declaration: true,
            importHelpers: false,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            target: monaco.languages.typescript.ScriptTarget.ES2017,
            jsx: monaco.languages.typescript.JsxEmit.React,
            module: monaco.languages.typescript.ModuleKind.ESNext,
        };
        return Object.assign(Object.assign({}, settings), config.compilerOptions);
    }
    exports.getDefaultSandboxCompilerOptions = getDefaultSandboxCompilerOptions;
    /**
     * Loop through all of the entries in the existing compiler options then compare them with the
     * query params and return an object which is the changed settings via the query params
     */
    const getCompilerOptionsFromParams = (options, params) => {
        const urlDefaults = Object.entries(options).reduce((acc, [key, value]) => {
            if (params.has(key)) {
                const urlValue = params.get(key);
                if (urlValue === "true") {
                    acc[key] = true;
                }
                else if (urlValue === "false") {
                    acc[key] = false;
                }
                else if (!isNaN(parseInt(urlValue, 10))) {
                    acc[key] = parseInt(urlValue, 10);
                }
            }
            return acc;
        }, {});
        return urlDefaults;
    };
    exports.getCompilerOptionsFromParams = getCompilerOptionsFromParams;
    // Can't set sandbox to be the right type because the param would contain this function
    /** Gets a query string representation (hash + queries) */
    const createURLQueryWithCompilerOptions = (_sandbox, paramOverrides) => {
        const sandbox = _sandbox;
        const initialOptions = new URLSearchParams(document.location.search);
        const compilerOptions = sandbox.getCompilerOptions();
        const compilerDefaults = sandbox.compilerDefaults;
        const diff = Object.entries(compilerOptions).reduce((acc, [key, value]) => {
            if (value !== compilerDefaults[key]) {
                // @ts-ignore
                acc[key] = compilerOptions[key];
            }
            return acc;
        }, {});
        // The text of the TS/JS as the hash
        const hash = `code/${sandbox.lzstring.compressToEncodedURIComponent(sandbox.getText())}`;
        let urlParams = Object.assign({}, diff);
        for (const param of ["lib", "ts"]) {
            const params = new URLSearchParams(location.search);
            if (params.has(param)) {
                // Special case the nightly where it uses the TS version to hardcode
                // the nightly build
                if (param === "ts" && (params.get(param) === "Nightly" || params.get(param) === "next")) {
                    urlParams["ts"] = sandbox.ts.version;
                }
                else {
                    urlParams["ts"] = params.get(param);
                }
            }
        }
        // Support sending the selection, but only if there is a selection, and it's not the whole thing
        const s = sandbox.editor.getSelection();
        const isNotEmpty = (s && s.selectionStartLineNumber !== s.positionLineNumber) || (s && s.selectionStartColumn !== s.positionColumn);
        const range = sandbox.editor.getModel().getFullModelRange();
        const isFull = s &&
            s.selectionStartLineNumber === range.startLineNumber &&
            s.selectionStartColumn === range.startColumn &&
            s.positionColumn === range.endColumn &&
            s.positionLineNumber === range.endLineNumber;
        if (s && isNotEmpty && !isFull) {
            urlParams["ssl"] = s.selectionStartLineNumber;
            urlParams["ssc"] = s.selectionStartColumn;
            urlParams["pln"] = s.positionLineNumber;
            urlParams["pc"] = s.positionColumn;
        }
        else {
            urlParams["ssl"] = undefined;
            urlParams["ssc"] = undefined;
            urlParams["pln"] = undefined;
            urlParams["pc"] = undefined;
        }
        if (sandbox.config.filetype !== "ts")
            urlParams["filetype"] = sandbox.config.filetype;
        if (paramOverrides) {
            urlParams = Object.assign(Object.assign({}, urlParams), paramOverrides);
        }
        // @ts-ignore - this is in MDN but not libdom
        const hasInitialOpts = initialOptions.keys().length > 0;
        if (Object.keys(urlParams).length > 0 || hasInitialOpts) {
            let queryString = Object.entries(urlParams)
                .filter(([_k, v]) => v !== undefined)
                .filter(([_k, v]) => v !== null)
                .map(([key, value]) => {
                return `${key}=${encodeURIComponent(value)}`;
            })
                .join("&");
            // We want to keep around custom query variables, which
            // are usually used by playground plugins, with the exception
            // being the install-plugin param and any compiler options
            // which have a default value
            initialOptions.forEach((value, key) => {
                const skip = ["ssl", "ssc", "pln", "pc"];
                if (skip.includes(key))
                    return;
                if (queryString.includes(key))
                    return;
                if (compilerOptions[key])
                    return;
                queryString += `&${key}=${value}`;
            });
            return `?${queryString}#${hash}`;
        }
        else {
            return `#${hash}`;
        }
    };
    exports.createURLQueryWithCompilerOptions = createURLQueryWithCompilerOptions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXJPcHRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc2FuZGJveC9zcmMvY29tcGlsZXJPcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUFLQTs7O09BR0c7SUFDSCxTQUFnQixnQ0FBZ0MsQ0FBQyxNQUFxQixFQUFFLE1BQWM7UUFDcEYsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUE7UUFDOUMsTUFBTSxRQUFRLEdBQW9CO1lBQ2hDLGFBQWEsRUFBRSxJQUFJO1lBQ25CLGdCQUFnQixFQUFFLENBQUMsYUFBYTtZQUNoQyxtQkFBbUIsRUFBRSxJQUFJO1lBQ3pCLDRCQUE0QixFQUFFLElBQUk7WUFDbEMsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixjQUFjLEVBQUUsSUFBSTtZQUNwQixpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLHdCQUF3QixFQUFFLEtBQUs7WUFFL0IsMEJBQTBCO1lBQzFCLHVCQUF1QixFQUFFLEtBQUs7WUFFOUIsWUFBWSxFQUFFLElBQUk7WUFDbEIsb0JBQW9CLEVBQUUsS0FBSztZQUMzQixpQkFBaUIsRUFBRSxLQUFLO1lBRXhCLGtCQUFrQixFQUFFLEtBQUs7WUFDekIsYUFBYSxFQUFFLEtBQUs7WUFDcEIsS0FBSyxFQUFFLEtBQUs7WUFDWixxQkFBcUIsRUFBRSxLQUFLO1lBQzVCLGNBQWMsRUFBRSxLQUFLO1lBQ3JCLGtCQUFrQixFQUFFLEtBQUs7WUFFekIsZUFBZSxFQUFFLElBQUk7WUFDckIsa0JBQWtCLEVBQUUsS0FBSztZQUN6QixjQUFjLEVBQUUsS0FBSztZQUNyQixZQUFZLEVBQUUsS0FBSztZQUVuQixPQUFPLEVBQUUsYUFBYTtZQUN0QixPQUFPLEVBQUUsYUFBYTtZQUN0QixXQUFXLEVBQUUsSUFBSTtZQUVqQixhQUFhLEVBQUUsS0FBSztZQUVwQixzQkFBc0IsRUFBRSxJQUFJO1lBQzVCLHFCQUFxQixFQUFFLElBQUk7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QUUsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDO2lCQUNwQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQztpQkFDL0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRTtnQkFDcEIsT0FBTyxHQUFHLEdBQUcsSUFBSSxrQkFBa0IsQ0FBQyxLQUFlLENBQUMsRUFBRSxDQUFBO1lBQ3hELENBQUMsQ0FBQztpQkFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7WUFFWix1REFBdUQ7WUFDdkQsNkRBQTZEO1lBQzdELDBEQUEwRDtZQUMxRCw2QkFBNkI7WUFFN0IsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDcEMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQTtnQkFDeEMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQztvQkFBRSxPQUFNO2dCQUM5QixJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO29CQUFFLE9BQU07Z0JBQ3JDLElBQUksZUFBZSxDQUFDLEdBQUcsQ0FBQztvQkFBRSxPQUFNO2dCQUVoQyxXQUFXLElBQUksSUFBSSxHQUFHLElBQUksS0FBSyxFQUFFLENBQUE7WUFDbkMsQ0FBQyxDQUFDLENBQUE7WUFFRixPQUFPLElBQUksV0FBVyxJQUFJLElBQUksRUFBRSxDQUFBO1NBQ2pDO2FBQU07WUFDTCxPQUFPLElBQUksSUFBSSxFQUFFLENBQUE7U0FDbEI7SUFDSCxDQUFDLENBQUE7SUE5RlksUUFBQSxpQ0FBaUMscUNBOEY3QyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNhbmRib3hDb25maWcgfSBmcm9tIFwiLlwiXG5cbnR5cGUgQ29tcGlsZXJPcHRpb25zID0gaW1wb3J0KFwibW9uYWNvLWVkaXRvclwiKS5sYW5ndWFnZXMudHlwZXNjcmlwdC5Db21waWxlck9wdGlvbnNcbnR5cGUgTW9uYWNvID0gdHlwZW9mIGltcG9ydChcIm1vbmFjby1lZGl0b3JcIilcblxuLyoqXG4gKiBUaGVzZSBhcmUgdGhlIGRlZmF1bHRzLCBidXQgdGhleSBhbHNvIGFjdCBhcyB0aGUgbGlzdCBvZiBhbGwgY29tcGlsZXIgb3B0aW9uc1xuICogd2hpY2ggYXJlIHBhcnNlZCBpbiB0aGUgcXVlcnkgcGFyYW1zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmYXVsdFNhbmRib3hDb21waWxlck9wdGlvbnMoY29uZmlnOiBTYW5kYm94Q29uZmlnLCBtb25hY286IE1vbmFjbykge1xuICBjb25zdCB1c2VKYXZhU2NyaXB0ID0gY29uZmlnLmZpbGV0eXBlID09PSBcImpzXCJcbiAgY29uc3Qgc2V0dGluZ3M6IENvbXBpbGVyT3B0aW9ucyA9IHtcbiAgICBub0ltcGxpY2l0QW55OiB0cnVlLFxuICAgIHN0cmljdE51bGxDaGVja3M6ICF1c2VKYXZhU2NyaXB0LFxuICAgIHN0cmljdEZ1bmN0aW9uVHlwZXM6IHRydWUsXG4gICAgc3RyaWN0UHJvcGVydHlJbml0aWFsaXphdGlvbjogdHJ1ZSxcbiAgICBzdHJpY3RCaW5kQ2FsbEFwcGx5OiB0cnVlLFxuICAgIG5vSW1wbGljaXRUaGlzOiB0cnVlLFxuICAgIG5vSW1wbGljaXRSZXR1cm5zOiB0cnVlLFxuICAgIG5vVW5jaGVja2VkSW5kZXhlZEFjY2VzczogZmFsc2UsXG5cbiAgICAvLyAzLjcgb2ZmLCAzLjggb24gSSB0aGlua1xuICAgIHVzZURlZmluZUZvckNsYXNzRmllbGRzOiBmYWxzZSxcblxuICAgIGFsd2F5c1N0cmljdDogdHJ1ZSxcbiAgICBhbGxvd1VucmVhY2hhYmxlQ29kZTogZmFsc2UsXG4gICAgYWxsb3dVbnVzZWRMYWJlbHM6IGZhbHNlLFxuXG4gICAgZG93bmxldmVsSXRlcmF0aW9uOiBmYWxzZSxcbiAgICBub0VtaXRIZWxwZXJzOiBmYWxzZSxcbiAgICBub0xpYjogZmFsc2UsXG4gICAgbm9TdHJpY3RHZW5lcmljQ2hlY2tzOiBmYWxzZSxcbiAgICBub1VudXNlZExvY2FsczogZmFsc2UsXG4gICAgbm9VbnVzZWRQYXJhbWV0ZXJzOiBmYWxzZSxcblxuICAgIGVzTW9kdWxlSW50ZXJvcDogdHJ1ZSxcbiAgICBwcmVzZXJ2ZUNvbnN0RW51bXM6IGZhbHNlLFxuICAgIHJlbW92ZUNvbW1lbnRzOiBmYWxzZSxcbiAgICBza2lwTGliQ2hlY2s6IGZhbHNlLFxuXG4gICAgY2hlY2tKczogdXNlSmF2YVNjcmlwdCxcbiAgICBhbGxvd0pzOiB1c2VKYXZhU2NyaXB0LFxuICAgIGRlY2xhcmF0aW9uOiB0cnVlLFxuXG4gICAgaW1wb3J0SGVscGVyczogZmFsc2UsXG5cbiAgICBleHBlcmltZW50YWxEZWNvcmF0b3JzOiB0cnVlLFxuICAgIGVtaXREZWNvcmF0b3JNZXRhZGF0YTogdHJ1ZSxcbiAgICBtb2R1bGVSZXNvbHV0aW9uOiBtb25hY28ubGFuZ3VhZ2VzLnR5cGVzY3JpcHQuTW9kdWxlUmVzb2x1dGlvbktpbmQuTm9kZUpzLFxuXG4gICAgdGFyZ2V0OiBtb25hY28ubGFuZ3VhZ2VzLnR5cGVzY3JpcHQuU2NyaXB0VGFyZ2V0LkVTMjAxNyxcbiAgICBqc3g6IG1vbmFjby5sYW5ndWFnZXMudHlwZXNjcmlwdC5Kc3hFbWl0LlJlYWN0LFxuICAgIG1vZHVsZTogbW9uYWNvLmxhbmd1YWdlcy50eXBlc2NyaXB0Lk1vZHVsZUtpbmQuRVNOZXh0LFxuICB9XG5cbiAgcmV0dXJuIHsgLi4uc2V0dGluZ3MsIC4uLmNvbmZpZy5jb21waWxlck9wdGlvbnMgfVxufVxuXG4vKipcbiAqIExvb3AgdGhyb3VnaCBhbGwgb2YgdGhlIGVudHJpZXMgaW4gdGhlIGV4aXN0aW5nIGNvbXBpbGVyIG9wdGlvbnMgdGhlbiBjb21wYXJlIHRoZW0gd2l0aCB0aGVcbiAqIHF1ZXJ5IHBhcmFtcyBhbmQgcmV0dXJuIGFuIG9iamVjdCB3aGljaCBpcyB0aGUgY2hhbmdlZCBzZXR0aW5ncyB2aWEgdGhlIHF1ZXJ5IHBhcmFtc1xuICovXG5leHBvcnQgY29uc3QgZ2V0Q29tcGlsZXJPcHRpb25zRnJvbVBhcmFtcyA9IChvcHRpb25zOiBDb21waWxlck9wdGlvbnMsIHBhcmFtczogVVJMU2VhcmNoUGFyYW1zKTogQ29tcGlsZXJPcHRpb25zID0+IHtcbiAgY29uc3QgdXJsRGVmYXVsdHMgPSBPYmplY3QuZW50cmllcyhvcHRpb25zKS5yZWR1Y2UoKGFjYzogYW55LCBba2V5LCB2YWx1ZV0pID0+IHtcbiAgICBpZiAocGFyYW1zLmhhcyhrZXkpKSB7XG4gICAgICBjb25zdCB1cmxWYWx1ZSA9IHBhcmFtcy5nZXQoa2V5KSFcblxuICAgICAgaWYgKHVybFZhbHVlID09PSBcInRydWVcIikge1xuICAgICAgICBhY2Nba2V5XSA9IHRydWVcbiAgICAgIH0gZWxzZSBpZiAodXJsVmFsdWUgPT09IFwiZmFsc2VcIikge1xuICAgICAgICBhY2Nba2V5XSA9IGZhbHNlXG4gICAgICB9IGVsc2UgaWYgKCFpc05hTihwYXJzZUludCh1cmxWYWx1ZSwgMTApKSkge1xuICAgICAgICBhY2Nba2V5XSA9IHBhcnNlSW50KHVybFZhbHVlLCAxMClcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYWNjXG4gIH0sIHt9KVxuXG4gIHJldHVybiB1cmxEZWZhdWx0c1xufVxuXG4vLyBDYW4ndCBzZXQgc2FuZGJveCB0byBiZSB0aGUgcmlnaHQgdHlwZSBiZWNhdXNlIHRoZSBwYXJhbSB3b3VsZCBjb250YWluIHRoaXMgZnVuY3Rpb25cblxuLyoqIEdldHMgYSBxdWVyeSBzdHJpbmcgcmVwcmVzZW50YXRpb24gKGhhc2ggKyBxdWVyaWVzKSAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZVVSTFF1ZXJ5V2l0aENvbXBpbGVyT3B0aW9ucyA9IChfc2FuZGJveDogYW55LCBwYXJhbU92ZXJyaWRlcz86IGFueSk6IHN0cmluZyA9PiB7XG4gIGNvbnN0IHNhbmRib3ggPSBfc2FuZGJveCBhcyBpbXBvcnQoXCIuL2luZGV4XCIpLlNhbmRib3hcbiAgY29uc3QgaW5pdGlhbE9wdGlvbnMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKGRvY3VtZW50LmxvY2F0aW9uLnNlYXJjaClcblxuICBjb25zdCBjb21waWxlck9wdGlvbnMgPSBzYW5kYm94LmdldENvbXBpbGVyT3B0aW9ucygpXG4gIGNvbnN0IGNvbXBpbGVyRGVmYXVsdHMgPSBzYW5kYm94LmNvbXBpbGVyRGVmYXVsdHNcbiAgY29uc3QgZGlmZiA9IE9iamVjdC5lbnRyaWVzKGNvbXBpbGVyT3B0aW9ucykucmVkdWNlKChhY2MsIFtrZXksIHZhbHVlXSkgPT4ge1xuICAgIGlmICh2YWx1ZSAhPT0gY29tcGlsZXJEZWZhdWx0c1trZXldKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBhY2Nba2V5XSA9IGNvbXBpbGVyT3B0aW9uc1trZXldXG4gICAgfVxuXG4gICAgcmV0dXJuIGFjY1xuICB9LCB7fSlcblxuICAvLyBUaGUgdGV4dCBvZiB0aGUgVFMvSlMgYXMgdGhlIGhhc2hcbiAgY29uc3QgaGFzaCA9IGBjb2RlLyR7c2FuZGJveC5senN0cmluZy5jb21wcmVzc1RvRW5jb2RlZFVSSUNvbXBvbmVudChzYW5kYm94LmdldFRleHQoKSl9YFxuXG4gIGxldCB1cmxQYXJhbXM6IGFueSA9IE9iamVjdC5hc3NpZ24oe30sIGRpZmYpXG4gIGZvciAoY29uc3QgcGFyYW0gb2YgW1wibGliXCIsIFwidHNcIl0pIHtcbiAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKGxvY2F0aW9uLnNlYXJjaClcbiAgICBpZiAocGFyYW1zLmhhcyhwYXJhbSkpIHtcbiAgICAgIC8vIFNwZWNpYWwgY2FzZSB0aGUgbmlnaHRseSB3aGVyZSBpdCB1c2VzIHRoZSBUUyB2ZXJzaW9uIHRvIGhhcmRjb2RlXG4gICAgICAvLyB0aGUgbmlnaHRseSBidWlsZFxuICAgICAgaWYgKHBhcmFtID09PSBcInRzXCIgJiYgKHBhcmFtcy5nZXQocGFyYW0pID09PSBcIk5pZ2h0bHlcIiB8fCBwYXJhbXMuZ2V0KHBhcmFtKSA9PT0gXCJuZXh0XCIpKSB7XG4gICAgICAgIHVybFBhcmFtc1tcInRzXCJdID0gc2FuZGJveC50cy52ZXJzaW9uXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmxQYXJhbXNbXCJ0c1wiXSA9IHBhcmFtcy5nZXQocGFyYW0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gU3VwcG9ydCBzZW5kaW5nIHRoZSBzZWxlY3Rpb24sIGJ1dCBvbmx5IGlmIHRoZXJlIGlzIGEgc2VsZWN0aW9uLCBhbmQgaXQncyBub3QgdGhlIHdob2xlIHRoaW5nXG4gIGNvbnN0IHMgPSBzYW5kYm94LmVkaXRvci5nZXRTZWxlY3Rpb24oKVxuXG4gIGNvbnN0IGlzTm90RW1wdHkgPVxuICAgIChzICYmIHMuc2VsZWN0aW9uU3RhcnRMaW5lTnVtYmVyICE9PSBzLnBvc2l0aW9uTGluZU51bWJlcikgfHwgKHMgJiYgcy5zZWxlY3Rpb25TdGFydENvbHVtbiAhPT0gcy5wb3NpdGlvbkNvbHVtbilcblxuICBjb25zdCByYW5nZSA9IHNhbmRib3guZWRpdG9yLmdldE1vZGVsKCkhLmdldEZ1bGxNb2RlbFJhbmdlKClcbiAgY29uc3QgaXNGdWxsID1cbiAgICBzICYmXG4gICAgcy5zZWxlY3Rpb25TdGFydExpbmVOdW1iZXIgPT09IHJhbmdlLnN0YXJ0TGluZU51bWJlciAmJlxuICAgIHMuc2VsZWN0aW9uU3RhcnRDb2x1bW4gPT09IHJhbmdlLnN0YXJ0Q29sdW1uICYmXG4gICAgcy5wb3NpdGlvbkNvbHVtbiA9PT0gcmFuZ2UuZW5kQ29sdW1uICYmXG4gICAgcy5wb3NpdGlvbkxpbmVOdW1iZXIgPT09IHJhbmdlLmVuZExpbmVOdW1iZXJcblxuICBpZiAocyAmJiBpc05vdEVtcHR5ICYmICFpc0Z1bGwpIHtcbiAgICB1cmxQYXJhbXNbXCJzc2xcIl0gPSBzLnNlbGVjdGlvblN0YXJ0TGluZU51bWJlclxuICAgIHVybFBhcmFtc1tcInNzY1wiXSA9IHMuc2VsZWN0aW9uU3RhcnRDb2x1bW5cbiAgICB1cmxQYXJhbXNbXCJwbG5cIl0gPSBzLnBvc2l0aW9uTGluZU51bWJlclxuICAgIHVybFBhcmFtc1tcInBjXCJdID0gcy5wb3NpdGlvbkNvbHVtblxuICB9IGVsc2Uge1xuICAgIHVybFBhcmFtc1tcInNzbFwiXSA9IHVuZGVmaW5lZFxuICAgIHVybFBhcmFtc1tcInNzY1wiXSA9IHVuZGVmaW5lZFxuICAgIHVybFBhcmFtc1tcInBsblwiXSA9IHVuZGVmaW5lZFxuICAgIHVybFBhcmFtc1tcInBjXCJdID0gdW5kZWZpbmVkXG4gIH1cblxuICBpZiAoc2FuZGJveC5jb25maWcuZmlsZXR5cGUgIT09IFwidHNcIikgdXJsUGFyYW1zW1wiZmlsZXR5cGVcIl0gPSBzYW5kYm94LmNvbmZpZy5maWxldHlwZVxuXG4gIGlmIChwYXJhbU92ZXJyaWRlcykge1xuICAgIHVybFBhcmFtcyA9IHsgLi4udXJsUGFyYW1zLCAuLi5wYXJhbU92ZXJyaWRlcyB9XG4gIH1cblxuICAvLyBAdHMtaWdub3JlIC0gdGhpcyBpcyBpbiBNRE4gYnV0IG5vdCBsaWJkb21cbiAgY29uc3QgaGFzSW5pdGlhbE9wdHMgPSBpbml0aWFsT3B0aW9ucy5rZXlzKCkubGVuZ3RoID4gMFxuXG4gIGlmIChPYmplY3Qua2V5cyh1cmxQYXJhbXMpLmxlbmd0aCA+IDAgfHwgaGFzSW5pdGlhbE9wdHMpIHtcbiAgICBsZXQgcXVlcnlTdHJpbmcgPSBPYmplY3QuZW50cmllcyh1cmxQYXJhbXMpXG4gICAgICAuZmlsdGVyKChbX2ssIHZdKSA9PiB2ICE9PSB1bmRlZmluZWQpXG4gICAgICAuZmlsdGVyKChbX2ssIHZdKSA9PiB2ICE9PSBudWxsKVxuICAgICAgLm1hcCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIHJldHVybiBgJHtrZXl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlIGFzIHN0cmluZyl9YFxuICAgICAgfSlcbiAgICAgIC5qb2luKFwiJlwiKVxuXG4gICAgLy8gV2Ugd2FudCB0byBrZWVwIGFyb3VuZCBjdXN0b20gcXVlcnkgdmFyaWFibGVzLCB3aGljaFxuICAgIC8vIGFyZSB1c3VhbGx5IHVzZWQgYnkgcGxheWdyb3VuZCBwbHVnaW5zLCB3aXRoIHRoZSBleGNlcHRpb25cbiAgICAvLyBiZWluZyB0aGUgaW5zdGFsbC1wbHVnaW4gcGFyYW0gYW5kIGFueSBjb21waWxlciBvcHRpb25zXG4gICAgLy8gd2hpY2ggaGF2ZSBhIGRlZmF1bHQgdmFsdWVcblxuICAgIGluaXRpYWxPcHRpb25zLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIGNvbnN0IHNraXAgPSBbXCJzc2xcIiwgXCJzc2NcIiwgXCJwbG5cIiwgXCJwY1wiXVxuICAgICAgaWYgKHNraXAuaW5jbHVkZXMoa2V5KSkgcmV0dXJuXG4gICAgICBpZiAocXVlcnlTdHJpbmcuaW5jbHVkZXMoa2V5KSkgcmV0dXJuXG4gICAgICBpZiAoY29tcGlsZXJPcHRpb25zW2tleV0pIHJldHVyblxuXG4gICAgICBxdWVyeVN0cmluZyArPSBgJiR7a2V5fT0ke3ZhbHVlfWBcbiAgICB9KVxuXG4gICAgcmV0dXJuIGA/JHtxdWVyeVN0cmluZ30jJHtoYXNofWBcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYCMke2hhc2h9YFxuICB9XG59XG4iXX0=