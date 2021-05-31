var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "./typeAcquisition", "./theme", "./compilerOptions", "./vendor/lzstring.min", "./releases", "./getInitialCode", "./twoslashSupport", "./vendor/typescript-vfs"], function (require, exports, typeAcquisition_1, theme_1, compilerOptions_1, lzstring_min_1, releases_1, getInitialCode_1, twoslashSupport_1, tsvfs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createTypeScriptSandbox = exports.defaultPlaygroundSettings = void 0;
    lzstring_min_1 = __importDefault(lzstring_min_1);
    tsvfs = __importStar(tsvfs);
    const languageType = (config) => (config.filetype === "js" ? "javascript" : "typescript");
    // Basically android and monaco is pretty bad, this makes it less bad
    // See https://github.com/microsoft/pxt/pull/7099 for this, and the long
    // read is in https://github.com/microsoft/monaco-editor/issues/563
    const isAndroid = navigator && /android/i.test(navigator.userAgent);
    /** Default Monaco settings for playground */
    const sharedEditorOptions = {
        scrollBeyondLastLine: true,
        scrollBeyondLastColumn: 3,
        minimap: {
            enabled: false,
        },
        lightbulb: {
            enabled: true,
        },
        quickSuggestions: {
            other: !isAndroid,
            comments: !isAndroid,
            strings: !isAndroid,
        },
        acceptSuggestionOnCommitCharacter: !isAndroid,
        acceptSuggestionOnEnter: !isAndroid ? "on" : "off",
        accessibilitySupport: !isAndroid ? "on" : "off",
    };
    /** The default settings which we apply a partial over */
    function defaultPlaygroundSettings() {
        const config = {
            text: "",
            domID: "",
            compilerOptions: {},
            acquireTypes: true,
            filetype: "ts",
            supportTwoslashCompilerOptions: false,
            logger: console,
        };
        return config;
    }
    exports.defaultPlaygroundSettings = defaultPlaygroundSettings;
    function defaultFilePath(config, compilerOptions, monaco) {
        const isJSX = compilerOptions.jsx !== monaco.languages.typescript.JsxEmit.None;
        const ext = isJSX && config.filetype !== "d.ts" ? config.filetype + "x" : config.filetype;
        return "input." + ext;
    }
    /** Creates a monaco file reference, basically a fancy path */
    function createFileUri(config, compilerOptions, monaco) {
        return monaco.Uri.file(defaultFilePath(config, compilerOptions, monaco));
    }
    /** Creates a sandbox editor, and returns a set of useful functions and the editor */
    const createTypeScriptSandbox = (partialConfig, monaco, ts) => {
        const config = Object.assign(Object.assign({}, defaultPlaygroundSettings()), partialConfig);
        if (!("domID" in config) && !("elementToAppend" in config))
            throw new Error("You did not provide a domID or elementToAppend");
        const defaultText = config.suppressAutomaticallyGettingDefaultText
            ? config.text
            : (0, getInitialCode_1.getInitialCode)(config.text, document.location);
        // Defaults
        const compilerDefaults = (0, compilerOptions_1.getDefaultSandboxCompilerOptions)(config, monaco);
        // Grab the compiler flags via the query params
        let compilerOptions;
        if (!config.suppressAutomaticallyGettingCompilerFlags) {
            const params = new URLSearchParams(location.search);
            let queryParamCompilerOptions = (0, compilerOptions_1.getCompilerOptionsFromParams)(compilerDefaults, params);
            if (Object.keys(queryParamCompilerOptions).length)
                config.logger.log("[Compiler] Found compiler options in query params: ", queryParamCompilerOptions);
            compilerOptions = Object.assign(Object.assign({}, compilerDefaults), queryParamCompilerOptions);
        }
        else {
            compilerOptions = compilerDefaults;
        }
        const isJSLang = config.filetype === "js";
        // Don't allow a state like allowJs = false
        if (isJSLang) {
            compilerOptions.allowJs = true;
        }
        const language = languageType(config);
        const filePath = createFileUri(config, compilerOptions, monaco);
        const element = "domID" in config ? document.getElementById(config.domID) : config.elementToAppend;
        const model = monaco.editor.createModel(defaultText, language, filePath);
        monaco.editor.defineTheme("sandbox", theme_1.sandboxTheme);
        monaco.editor.defineTheme("sandbox-dark", theme_1.sandboxThemeDark);
        monaco.editor.setTheme("sandbox");
        const monacoSettings = Object.assign({ model }, sharedEditorOptions, config.monacoSettings || {});
        const editor = monaco.editor.create(element, monacoSettings);
        const getWorker = isJSLang
            ? monaco.languages.typescript.getJavaScriptWorker
            : monaco.languages.typescript.getTypeScriptWorker;
        const defaults = isJSLang
            ? monaco.languages.typescript.javascriptDefaults
            : monaco.languages.typescript.typescriptDefaults;
        defaults.setDiagnosticsOptions(Object.assign(Object.assign({}, defaults.getDiagnosticsOptions()), { noSemanticValidation: false, 
            // This is when tslib is not found
            diagnosticCodesToIgnore: [2354] }));
        // In the future it'd be good to add support for an 'add many files'
        const addLibraryToRuntime = (code, path) => {
            defaults.addExtraLib(code, path);
            const uri = monaco.Uri.file(path);
            if (monaco.editor.getModel(uri) === null) {
                monaco.editor.createModel(code, "javascript", uri);
            }
            config.logger.log(`[ATA] Adding ${path} to runtime`);
        };
        const getTwoSlashComplierOptions = (0, twoslashSupport_1.extractTwoSlashComplierOptions)(ts);
        // Auto-complete twoslash comments
        if (config.supportTwoslashCompilerOptions) {
            const langs = ["javascript", "typescript"];
            langs.forEach(l => monaco.languages.registerCompletionItemProvider(l, {
                triggerCharacters: ["@", "/", "-"],
                provideCompletionItems: (0, twoslashSupport_1.twoslashCompletions)(ts, monaco),
            }));
        }
        const textUpdated = () => {
            const code = editor.getModel().getValue();
            if (config.supportTwoslashCompilerOptions) {
                const configOpts = getTwoSlashComplierOptions(code);
                updateCompilerSettings(configOpts);
            }
            if (config.acquireTypes) {
                (0, typeAcquisition_1.detectNewImportsToAcquireTypeFor)(code, addLibraryToRuntime, window.fetch.bind(window), config);
            }
        };
        // Debounced sandbox features like twoslash and type acquisition to once every second
        let debouncingTimer = false;
        editor.onDidChangeModelContent(_e => {
            if (debouncingTimer)
                return;
            debouncingTimer = true;
            setTimeout(() => {
                debouncingTimer = false;
                textUpdated();
            }, 1000);
        });
        config.logger.log("[Compiler] Set compiler options: ", compilerOptions);
        defaults.setCompilerOptions(compilerOptions);
        // Grab types last so that it logs in a logical way
        if (config.acquireTypes) {
            // Take the code from the editor right away
            const code = editor.getModel().getValue();
            (0, typeAcquisition_1.detectNewImportsToAcquireTypeFor)(code, addLibraryToRuntime, window.fetch.bind(window), config);
        }
        // To let clients plug into compiler settings changes
        let didUpdateCompilerSettings = (opts) => { };
        const updateCompilerSettings = (opts) => {
            const newKeys = Object.keys(opts);
            if (!newKeys.length)
                return;
            // Don't update a compiler setting if it's the same
            // as the current setting
            newKeys.forEach(key => {
                if (compilerOptions[key] == opts[key])
                    delete opts[key];
            });
            if (!Object.keys(opts).length)
                return;
            config.logger.log("[Compiler] Updating compiler options: ", opts);
            compilerOptions = Object.assign(Object.assign({}, compilerOptions), opts);
            defaults.setCompilerOptions(compilerOptions);
            didUpdateCompilerSettings(compilerOptions);
        };
        const updateCompilerSetting = (key, value) => {
            config.logger.log("[Compiler] Setting compiler options ", key, "to", value);
            compilerOptions[key] = value;
            defaults.setCompilerOptions(compilerOptions);
            didUpdateCompilerSettings(compilerOptions);
        };
        const setCompilerSettings = (opts) => {
            config.logger.log("[Compiler] Setting compiler options: ", opts);
            compilerOptions = opts;
            defaults.setCompilerOptions(compilerOptions);
            didUpdateCompilerSettings(compilerOptions);
        };
        const getCompilerOptions = () => {
            return compilerOptions;
        };
        const setDidUpdateCompilerSettings = (func) => {
            didUpdateCompilerSettings = func;
        };
        /** Gets the results of compiling your editor's code */
        const getEmitResult = () => __awaiter(void 0, void 0, void 0, function* () {
            const model = editor.getModel();
            const client = yield getWorkerProcess();
            return yield client.getEmitOutput(model.uri.toString());
        });
        /** Gets the JS  of compiling your editor's code */
        const getRunnableJS = () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield getEmitResult();
            const firstJS = result.outputFiles.find((o) => o.name.endsWith(".js") || o.name.endsWith(".jsx"));
            return (firstJS && firstJS.text) || "";
        });
        /** Gets the DTS for the JS/TS  of compiling your editor's code */
        const getDTSForCode = () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield getEmitResult();
            return result.outputFiles.find((o) => o.name.endsWith(".d.ts")).text;
        });
        const getWorkerProcess = () => __awaiter(void 0, void 0, void 0, function* () {
            const worker = yield getWorker();
            // @ts-ignore
            return yield worker(model.uri);
        });
        const getDomNode = () => editor.getDomNode();
        const getModel = () => editor.getModel();
        const getText = () => getModel().getValue();
        const setText = (text) => getModel().setValue(text);
        const setupTSVFS = (fsMapAdditions) => __awaiter(void 0, void 0, void 0, function* () {
            const fsMap = yield tsvfs.createDefaultMapFromCDN(compilerOptions, ts.version, true, ts, lzstring_min_1.default);
            fsMap.set(filePath.path, getText());
            if (fsMapAdditions) {
                fsMapAdditions.forEach((v, k) => fsMap.set(k, v));
            }
            const system = tsvfs.createSystem(fsMap);
            const host = tsvfs.createVirtualCompilerHost(system, compilerOptions, ts);
            const program = ts.createProgram({
                rootNames: [...fsMap.keys()],
                options: compilerOptions,
                host: host.compilerHost,
            });
            return {
                program,
                system,
                host,
                fsMap,
            };
        });
        /**
         * Creates a TS Program, if you're doing anything complex
         * it's likely you want setupTSVFS instead and can pull program out from that
         *
         * Warning: Runs on the main thread
         */
        const createTSProgram = () => __awaiter(void 0, void 0, void 0, function* () {
            const tsvfs = yield setupTSVFS();
            return tsvfs.program;
        });
        const getAST = () => __awaiter(void 0, void 0, void 0, function* () {
            const program = yield createTSProgram();
            program.emit();
            return program.getSourceFile(filePath.path);
        });
        // Pass along the supported releases for the playground
        const supportedVersions = releases_1.supportedReleases;
        textUpdated();
        return {
            /** The same config you passed in */
            config,
            /** A list of TypeScript versions you can use with the TypeScript sandbox */
            supportedVersions,
            /** The monaco editor instance */
            editor,
            /** Either "typescript" or "javascript" depending on your config */
            language,
            /** The outer monaco module, the result of require("monaco-editor")  */
            monaco,
            /** Gets a monaco-typescript worker, this will give you access to a language server. Note: prefer this for language server work because it happens on a webworker . */
            getWorkerProcess,
            /** A copy of require("@typescript/vfs") this can be used to quickly set up an in-memory compiler runs for ASTs, or to get complex language server results (anything above has to be serialized when passed)*/
            tsvfs,
            /** Get all the different emitted files after TypeScript is run */
            getEmitResult,
            /** Gets just the JavaScript for your sandbox, will transpile if in TS only */
            getRunnableJS,
            /** Gets the DTS output of the main code in the editor */
            getDTSForCode,
            /** The monaco-editor dom node, used for showing/hiding the editor */
            getDomNode,
            /** The model is an object which monaco uses to keep track of text in the editor. Use this to directly modify the text in the editor */
            getModel,
            /** Gets the text of the main model, which is the text in the editor */
            getText,
            /** Shortcut for setting the model's text content which would update the editor */
            setText,
            /** Gets the AST of the current text in monaco - uses `createTSProgram`, so the performance caveat applies there too */
            getAST,
            /** The module you get from require("typescript") */
            ts,
            /** Create a new Program, a TypeScript data model which represents the entire project. As well as some of the
             * primitive objects you would normally need to do work with the files.
             *
             * The first time this is called it has to download all the DTS files which is needed for an exact compiler run. Which
             * at max is about 1.5MB - after that subsequent downloads of dts lib files come from localStorage.
             *
             * Try to use this sparingly as it can be computationally expensive, at the minimum you should be using the debounced setup.
             *
             * Accepts an optional fsMap which you can use to add any files, or overwrite the default file.
             *
             * TODO: It would be good to create an easy way to have a single program instance which is updated for you
             * when the monaco model changes.
             */
            setupTSVFS,
            /** Uses the above call setupTSVFS, but only returns the program */
            createTSProgram,
            /** The Sandbox's default compiler options  */
            compilerDefaults,
            /** The Sandbox's current compiler options */
            getCompilerOptions,
            /** Replace the Sandbox's compiler options */
            setCompilerSettings,
            /** Overwrite the Sandbox's compiler options */
            updateCompilerSetting,
            /** Update a single compiler option in the SAndbox */
            updateCompilerSettings,
            /** A way to get callbacks when compiler settings have changed */
            setDidUpdateCompilerSettings,
            /** A copy of lzstring, which is used to archive/unarchive code */
            lzstring: lzstring_min_1.default,
            /** Returns compiler options found in the params of the current page */
            createURLQueryWithCompilerOptions: compilerOptions_1.createURLQueryWithCompilerOptions,
            /** Returns compiler options in the source code using twoslash notation */
            getTwoSlashComplierOptions,
            /** Gets to the current monaco-language, this is how you talk to the background webworkers */
            languageServiceDefaults: defaults,
            /** The path which represents the current file using the current compiler options */
            filepath: filePath.path,
            /** Adds a file to the vfs used by the editor */
            addLibraryToRuntime,
        };
    };
    exports.createTypeScriptSandbox = createTypeScriptSandbox;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zYW5kYm94L3NyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBb0RBLE1BQU0sWUFBWSxHQUFHLENBQUMsTUFBcUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQTtJQUV4RyxxRUFBcUU7SUFDckUsd0VBQXdFO0lBQ3hFLG1FQUFtRTtJQUNuRSxNQUFNLFNBQVMsR0FBRyxTQUFTLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUE7SUFFbkUsNkNBQTZDO0lBQzdDLE1BQU0sbUJBQW1CLEdBQWtEO1FBQ3pFLG9CQUFvQixFQUFFLElBQUk7UUFDMUIsc0JBQXNCLEVBQUUsQ0FBQztRQUN6QixPQUFPLEVBQUU7WUFDUCxPQUFPLEVBQUUsS0FBSztTQUNmO1FBQ0QsU0FBUyxFQUFFO1lBQ1QsT0FBTyxFQUFFLElBQUk7U0FDZDtRQUNELGdCQUFnQixFQUFFO1lBQ2hCLEtBQUssRUFBRSxDQUFDLFNBQVM7WUFDakIsUUFBUSxFQUFFLENBQUMsU0FBUztZQUNwQixPQUFPLEVBQUUsQ0FBQyxTQUFTO1NBQ3BCO1FBQ0QsaUNBQWlDLEVBQUUsQ0FBQyxTQUFTO1FBQzdDLHVCQUF1QixFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUs7UUFDbEQsb0JBQW9CLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSztLQUNoRCxDQUFBO0lBRUQseURBQXlEO0lBQ3pELFNBQWdCLHlCQUF5QjtRQUN2QyxNQUFNLE1BQU0sR0FBa0I7WUFDNUIsSUFBSSxF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STtZQUN2QixnREFBZ0Q7WUFDaEQsbUJBQW1CO1NBQ3BCLENBQUE7SUFDSCxDQUFDLENBQUE7SUExVFksUUFBQSx1QkFBdUIsMkJBMFRuQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRldGVjdE5ld0ltcG9ydHNUb0FjcXVpcmVUeXBlRm9yIH0gZnJvbSBcIi4vdHlwZUFjcXVpc2l0aW9uXCJcbmltcG9ydCB7IHNhbmRib3hUaGVtZSwgc2FuZGJveFRoZW1lRGFyayB9IGZyb20gXCIuL3RoZW1lXCJcbmltcG9ydCB7IFR5cGVTY3JpcHRXb3JrZXIgfSBmcm9tIFwiLi90c1dvcmtlclwiXG5pbXBvcnQge1xuICBnZXREZWZhdWx0U2FuZGJveENvbXBpbGVyT3B0aW9ucyxcbiAgZ2V0Q29tcGlsZXJPcHRpb25zRnJvbVBhcmFtcyxcbiAgY3JlYXRlVVJMUXVlcnlXaXRoQ29tcGlsZXJPcHRpb25zLFxufSBmcm9tIFwiLi9jb21waWxlck9wdGlvbnNcIlxuaW1wb3J0IGx6c3RyaW5nIGZyb20gXCIuL3ZlbmRvci9senN0cmluZy5taW5cIlxuaW1wb3J0IHsgc3VwcG9ydGVkUmVsZWFzZXMgfSBmcm9tIFwiLi9yZWxlYXNlc1wiXG5pbXBvcnQgeyBnZXRJbml0aWFsQ29kZSB9IGZyb20gXCIuL2dldEluaXRpYWxDb2RlXCJcbmltcG9ydCB7IGV4dHJhY3RUd29TbGFzaENvbXBsaWVyT3B0aW9ucywgdHdvc2xhc2hDb21wbGV0aW9ucyB9IGZyb20gXCIuL3R3b3NsYXNoU3VwcG9ydFwiXG5pbXBvcnQgKiBhcyB0c3ZmcyBmcm9tIFwiLi92ZW5kb3IvdHlwZXNjcmlwdC12ZnNcIlxuXG50eXBlIENvbXBpbGVyT3B0aW9ucyA9IGltcG9ydChcIm1vbmFjby1lZGl0b3JcIikubGFuZ3VhZ2VzLnR5cGVzY3JpcHQuQ29tcGlsZXJPcHRpb25zXG50eXBlIE1vbmFjbyA9IHR5cGVvZiBpbXBvcnQoXCJtb25hY28tZWRpdG9yXCIpXG5cbi8qKlxuICogVGhlc2UgYXJlIHNldHRpbmdzIGZvciB0aGUgcGxheWdyb3VuZCB3aGljaCBhcmUgdGhlIGVxdWl2YWxlbnQgdG8gcHJvcHMgaW4gUmVhY3RcbiAqIGFueSBjaGFuZ2VzIHRvIGl0IHNob3VsZCByZXF1aXJlIGEgbmV3IHNldHVwIG9mIHRoZSBwbGF5Z3JvdW5kXG4gKi9cbmV4cG9ydCB0eXBlIFNhbmRib3hDb25maWcgPSB7XG4gIC8qKiBUaGUgZGVmYXVsdCBzb3VyY2UgY29kZSBmb3IgdGhlIHBsYXlncm91bmQgKi9cbiAgdGV4dDogc3RyaW5nXG4gIC8qKiBAZGVwcmVjYXRlZCAqL1xuICB1c2VKYXZhU2NyaXB0PzogYm9vbGVhblxuICAvKiogVGhlIGRlZmF1bHQgZmlsZSBmb3IgdGhlIHBsYWF5Z3JvdW5kICAqL1xuICBmaWxldHlwZTogXCJqc1wiIHwgXCJ0c1wiIHwgXCJkLnRzXCJcbiAgLyoqIENvbXBpbGVyIG9wdGlvbnMgd2hpY2ggYXJlIGF1dG9tYXRpY2FsbHkganVzdCBmb3J3YXJkZWQgb24gKi9cbiAgY29tcGlsZXJPcHRpb25zOiBDb21waWxlck9wdGlvbnNcbiAgLyoqIE9wdGlvbmFsIG1vbmFjbyBzZXR0aW5ncyBvdmVycmlkZXMgKi9cbiAgbW9uYWNvU2V0dGluZ3M/OiBpbXBvcnQoXCJtb25hY28tZWRpdG9yXCIpLmVkaXRvci5JRWRpdG9yT3B0aW9uc1xuICAvKiogQWNxdWlyZSB0eXBlcyB2aWEgdHlwZSBhY3F1aXNpdGlvbiAqL1xuICBhY3F1aXJlVHlwZXM6IGJvb2xlYW5cbiAgLyoqIFN1cHBvcnQgdHdvc2xhc2ggY29tcGlsZXIgb3B0aW9ucyAqL1xuICBzdXBwb3J0VHdvc2xhc2hDb21waWxlck9wdGlvbnM6IGJvb2xlYW5cbiAgLyoqIEdldCB0aGUgdGV4dCB2aWEgcXVlcnkgcGFyYW1zIGFuZCBsb2NhbCBzdG9yYWdlLCB1c2VmdWwgd2hlbiB0aGUgZWRpdG9yIGlzIHRoZSBtYWluIGV4cGVyaWVuY2UgKi9cbiAgc3VwcHJlc3NBdXRvbWF0aWNhbGx5R2V0dGluZ0RlZmF1bHRUZXh0PzogdHJ1ZVxuICAvKiogU3VwcHJlc3Mgc2V0dGluZyBjb21waWxlciBvcHRpb25zIGZyb20gdGhlIGNvbXBpbGVyIGZsYWdzIGZyb20gcXVlcnkgcGFyYW1zICovXG4gIHN1cHByZXNzQXV0b21hdGljYWxseUdldHRpbmdDb21waWxlckZsYWdzPzogdHJ1ZVxuICAvKiogTG9nZ2luZyBzeXN0ZW0gKi9cbiAgbG9nZ2VyOiB7XG4gICAgbG9nOiAoLi4uYXJnczogYW55W10pID0+IHZvaWRcbiAgICBlcnJvcjogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkXG4gICAgZ3JvdXBDb2xsYXBzZWQ6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZFxuICAgIGdyb3VwRW5kOiAoLi4uYXJnczogYW55W10pID0+IHZvaWRcbiAgfVxufSAmIChcbiAgfCB7IC8qKiB0aGVJRCBvZiBhIGRvbSBub2RlIHRvIGFkZCBtb25hY28gdG8gKi8gZG9tSUQ6IHN0cmluZyB9XG4gIHwgeyAvKiogdGhlSUQgb2YgYSBkb20gbm9kZSB0byBhZGQgbW9uYWNvIHRvICovIGVsZW1lbnRUb0FwcGVuZDogSFRNTEVsZW1lbnQgfVxuKVxuXG5jb25zdCBsYW5ndWFnZVR5cGUgPSAoY29uZmlnOiBTYW5kYm94Q29uZmlnKSA9PiAoY29uZmlnLmZpbGV0eXBlID09PSBcImpzXCIgPyBcImphdmFzY3JpcHRcIiA6IFwidHlwZXNjcmlwdFwiKVxuXG4vLyBCYXNpY2FsbHkgYW5kcm9pZCBhbmQgbW9uYWNvIGlzIHByZXR0eSBiYWQsIHRoaXMgbWFrZXMgaXQgbGVzcyBiYWRcbi8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L3B4dC9wdWxsLzcwOTkgZm9yIHRoaXMsIGFuZCB0aGUgbG9uZ1xuLy8gcmVhZCBpcyBpbiBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L21vbmFjby1lZGl0b3IvaXNzdWVzLzU2M1xuY29uc3QgaXNBbmRyb2lkID0gbmF2aWdhdG9yICYmIC9hbmRyb2lkL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KVxuXG4vKiogRGVmYXVsdCBNb25hY28gc2V0dGluZ3MgZm9yIHBsYXlncm91bmQgKi9cbmNvbnN0IHNoYXJlZEVkaXRvck9wdGlvbnM6IGltcG9ydChcIm1vbmFjby1lZGl0b3JcIikuZWRpdG9yLklFZGl0b3JPcHRpb25zID0ge1xuICBzY3JvbGxCZXlvbmRMYXN0TGluZTogdHJ1ZSxcbiAgc2Nyb2xsQmV5b25kTGFzdENvbHVtbjogMyxcbiAgbWluaW1hcDoge1xuICAgIGVuYWJsZWQ6IGZhbHNlLFxuICB9LFxuICBsaWdodGJ1bGI6IHtcbiAgICBlbmFibGVkOiB0cnVlLFxuICB9LFxuICBxdWlja1N1Z2dlc3Rpb25zOiB7XG4gICAgb3RoZXI6ICFpc0FuZHJvaWQsXG4gICAgY29tbWVudHM6ICFpc0FuZHJvaWQsXG4gICAgc3RyaW5nczogIWlzQW5kcm9pZCxcbiAgfSxcbiAgYWNjZXB0U3VnZ2VzdGlvbk9uQ29tbWl0Q2hhcmFjdGVyOiAhaXNBbmRyb2lkLFxuICBhY2NlcHRTdWdnZXN0aW9uT25FbnRlcjogIWlzQW5kcm9pZCA/IFwib25cIiA6IFwib2ZmXCIsXG4gIGFjY2Vzc2liaWxpdHlTdXBwb3J0OiAhaXNBbmRyb2lkID8gXCJvblwiIDogXCJvZmZcIixcbn1cblxuLyoqIFRoZSBkZWZhdWx0IHNldHRpbmdzIHdoaWNoIHdlIGFwcGx5IGEgcGFydGlhbCBvdmVyICovXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdFBsYXlncm91bmRTZXR0aW5ncygpIHtcbiAgY29uc3QgY29uZmlnOiBTYW5kYm94Q29uZmlnID0ge1xuICAgIHRleHQ6IFwiXCIsXG4gICAgZG9tSUQ6IFwiXCIsXG4gICAgY29tcGlsZXJPcHRpb25zOiB7fSxcbiAgICBhY3F1aXJlVHlwZXM6IHRydWUsXG4gICAgZmlsZXR5cGU6IFwidHNcIixcbiAgICBzdXBwb3J0VHdvc2xhc2hDb21waWxlck9wdGlvbnM6IGZhbHNlLFxuICAgIGxvZ2dlcjogY29uc29sZSxcbiAgfVxuICByZXR1cm4gY29uZmlnXG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRGaWxlUGF0aChjb25maWc6IFNhbmRib3hDb25maWcsIGNvbXBpbGVyT3B0aW9uczogQ29tcGlsZXJPcHRpb25zLCBtb25hY286IE1vbmFjbykge1xuICBjb25zdCBpc0pTWCA9IGNvbXBpbGVyT3B0aW9ucy5qc3ggIT09IG1vbmFjby5sYW5ndWFnZXMudHlwZXNjcmlwdC5Kc3hFbWl0Lk5vbmVcbiAgY29uc3QgZXh0ID0gaXNKU1ggJiYgY29uZmlnLmZpbGV0eXBlICE9PSBcImQudHNcIiA/IGNvbmZpZy5maWxldHlwZSArIFwieFwiIDogY29uZmlnLmZpbGV0eXBlXG4gIHJldHVybiBcImlucHV0LlwiICsgZXh0XG59XG5cbi8qKiBDcmVhdGVzIGEgbW9uYWNvIGZpbGUgcmVmZXJlbmNlLCBiYXNpY2FsbHkgYSBmYW5jeSBwYXRoICovXG5mdW5jdGlvbiBjcmVhdGVGaWxlVXJpKGNvbmZpZzogU2FuZGJveENvbmZpZywgY29tcGlsZXJPcHRpb25zOiBDb21waWxlck9wdGlvbnMsIG1vbmFjbzogTW9uYWNvKSB7XG4gIHJldHVybiBtb25hY28uVXJpLmZpbGUoZGVmYXVsdEZpbGVQYXRoKGNvbmZpZywgY29tcGlsZXJPcHRpb25zLCBtb25hY28pKVxufVxuXG4vKiogQ3JlYXRlcyBhIHNhbmRib3ggZWRpdG9yLCBhbmQgcmV0dXJucyBhIHNldCBvZiB1c2VmdWwgZnVuY3Rpb25zIGFuZCB0aGUgZWRpdG9yICovXG5leHBvcnQgY29uc3QgY3JlYXRlVHlwZVNjcmlwdFNhbmRib3ggPSAoXG4gIHBhcnRpYWxDb25maWc6IFBhcnRpYWw8U2FuZGJveENvbmZpZz4sXG4gIG1vbmFjbzogTW9uYWNvLFxuICB0czogdHlwZW9mIGltcG9ydChcInR5cGVzY3JpcHRcIilcbikgPT4ge1xuICBjb25zdCBjb25maWcgPSB7IC4uLmRlZmF1bHRQbGF5Z3JvdW5kU2V0dGluZ3MoKSwgLi4ucGFydGlhbENvbmZpZyB9XG4gIGlmICghKFwiZG9tSURcIiBpbiBjb25maWcpICYmICEoXCJlbGVtZW50VG9BcHBlbmRcIiBpbiBjb25maWcpKVxuICAgIHRocm93IG5ldyBFcnJvcihcIllvdSBkaWQgbm90IHByb3ZpZGUgYSBkb21JRCBvciBlbGVtZW50VG9BcHBlbmRcIilcblxuICBjb25zdCBkZWZhdWx0VGV4dCA9IGNvbmZpZy5zdXBwcmVzc0F1dG9tYXRpY2FsbHlHZXR0aW5nRGVmYXVsdFRleHRcbiAgICA/IGNvbmZpZy50ZXh0XG4gICAgOiBnZXRJbml0aWFsQ29kZShjb25maWcudGV4dCwgZG9jdW1lbnQubG9jYXRpb24pXG5cbiAgLy8gRGVmYXVsdHNcbiAgY29uc3QgY29tcGlsZXJEZWZhdWx0cyA9IGdldERlZmF1bHRTYW5kYm94Q29tcGlsZXJPcHRpb25zKGNvbmZpZywgbW9uYWNvKVxuXG4gIC8vIEdyYWIgdGhlIGNvbXBpbGVyIGZsYWdzIHZpYSB0aGUgcXVlcnkgcGFyYW1zXG4gIGxldCBjb21waWxlck9wdGlvbnM6IENvbXBpbGVyT3B0aW9uc1xuICBpZiAoIWNvbmZpZy5zdXBwcmVzc0F1dG9tYXRpY2FsbHlHZXR0aW5nQ29tcGlsZXJGbGFncykge1xuICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMobG9jYXRpb24uc2VhcmNoKVxuICAgIGxldCBxdWVyeVBhcmFtQ29tcGlsZXJPcHRpb25zID0gZ2V0Q29tcGlsZXJPcHRpb25zRnJvbVBhcmFtcyhjb21waWxlckRlZmF1bHRzLCBwYXJhbXMpXG4gICAgaWYgKE9iamVjdC5rZXlzKHF1ZXJ5UGFyYW1Db21waWxlck9wdGlvbnMpLmxlbmd0aClcbiAgICAgIGNvbmZpZy5sb2dnZXIubG9nKFwiW0NvbXBpbGVyXSBGb3VuZCBjb21waWxlciBvcHRpb25zIGluIHF1ZXJ5IHBhcmFtczogXCIsIHF1ZXJ5UGFyYW1Db21waWxlck9wdGlvbnMpXG4gICAgY29tcGlsZXJPcHRpb25zID0geyAuLi5jb21waWxlckRlZmF1bHRzLCAuLi5xdWVyeVBhcmFtQ29tcGlsZXJPcHRpb25zIH1cbiAgfSBlbHNlIHtcbiAgICBjb21waWxlck9wdGlvbnMgPSBjb21waWxlckRlZmF1bHRzXG4gIH1cblxuICBjb25zdCBpc0pTTGFuZyA9IGNvbmZpZy5maWxldHlwZSA9PT0gXCJqc1wiXG4gIC8vIERvbid0IGFsbG93IGEgc3RhdGUgbGlrZSBhbGxvd0pzID0gZmFsc2VcbiAgaWYgKGlzSlNMYW5nKSB7XG4gICAgY29tcGlsZXJPcHRpb25zLmFsbG93SnMgPSB0cnVlXG4gIH1cblxuICBjb25zdCBsYW5ndWFnZSA9IGxhbmd1YWdlVHlwZShjb25maWcpXG4gIGNvbnN0IGZpbGVQYXRoID0gY3JlYXRlRmlsZVVyaShjb25maWcsIGNvbXBpbGVyT3B0aW9ucywgbW9uYWNvKVxuICBjb25zdCBlbGVtZW50ID0gXCJkb21JRFwiIGluIGNvbmZpZyA/IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNvbmZpZy5kb21JRCkgOiAoY29uZmlnIGFzIGFueSkuZWxlbWVudFRvQXBwZW5kXG5cbiAgY29uc3QgbW9kZWwgPSBtb25hY28uZWRpdG9yLmNyZWF0ZU1vZGVsKGRlZmF1bHRUZXh0LCBsYW5ndWFnZSwgZmlsZVBhdGgpXG4gIG1vbmFjby5lZGl0b3IuZGVmaW5lVGhlbWUoXCJzYW5kYm94XCIsIHNhbmRib3hUaGVtZSlcbiAgbW9uYWNvLmVkaXRvci5kZWZpbmVUaGVtZShcInNhbmRib3gtZGFya1wiLCBzYW5kYm94VGhlbWVEYXJrKVxuICBtb25hY28uZWRpdG9yLnNldFRoZW1lKFwic2FuZGJveFwiKVxuXG4gIGNvbnN0IG1vbmFjb1NldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7IG1vZGVsIH0sIHNoYXJlZEVkaXRvck9wdGlvbnMsIGNvbmZpZy5tb25hY29TZXR0aW5ncyB8fCB7fSlcbiAgY29uc3QgZWRpdG9yID0gbW9uYWNvLmVkaXRvci5jcmVhdGUoZWxlbWVudCwgbW9uYWNvU2V0dGluZ3MpXG5cbiAgY29uc3QgZ2V0V29ya2VyID0gaXNKU0xhbmdcbiAgICA/IG1vbmFjby5sYW5ndWFnZXMudHlwZXNjcmlwdC5nZXRKYXZhU2NyaXB0V29ya2VyXG4gICAgOiBtb25hY28ubGFuZ3VhZ2VzLnR5cGVzY3JpcHQuZ2V0VHlwZVNjcmlwdFdvcmtlclxuXG4gIGNvbnN0IGRlZmF1bHRzID0gaXNKU0xhbmdcbiAgICA/IG1vbmFjby5sYW5ndWFnZXMudHlwZXNjcmlwdC5qYXZhc2NyaXB0RGVmYXVsdHNcbiAgICA6IG1vbmFjby5sYW5ndWFnZXMudHlwZXNjcmlwdC50eXBlc2NyaXB0RGVmYXVsdHNcblxuICBkZWZhdWx0cy5zZXREaWFnbm9zdGljc09wdGlvbnMoe1xuICAgIC4uLmRlZmF1bHRzLmdldERpYWdub3N0aWNzT3B0aW9ucygpLFxuICAgIG5vU2VtYW50aWNWYWxpZGF0aW9uOiBmYWxzZSxcbiAgICAvLyBUaGlzIGlzIHdoZW4gdHNsaWIgaXMgbm90IGZvdW5kXG4gICAgZGlhZ25vc3RpY0NvZGVzVG9JZ25vcmU6IFsyMzU0XSxcbiAgfSlcblxuICAvLyBJbiB0aGUgZnV0dXJlIGl0J2QgYmUgZ29vZCB0byBhZGQgc3VwcG9ydCBmb3IgYW4gJ2FkZCBtYW55IGZpbGVzJ1xuICBjb25zdCBhZGRMaWJyYXJ5VG9SdW50aW1lID0gKGNvZGU6IHN0cmluZywgcGF0aDogc3RyaW5nKSA9PiB7XG4gICAgZGVmYXVsdHMuYWRkRXh0cmFMaWIoY29kZSwgcGF0aClcbiAgICBjb25zdCB1cmkgPSBtb25hY28uVXJpLmZpbGUocGF0aClcbiAgICBpZiAobW9uYWNvLmVkaXRvci5nZXRNb2RlbCh1cmkpID09PSBudWxsKSB7XG4gICAgICBtb25hY28uZWRpdG9yLmNyZWF0ZU1vZGVsKGNvZGUsIFwiamF2YXNjcmlwdFwiLCB1cmkpXG4gICAgfVxuICAgIGNvbmZpZy5sb2dnZXIubG9nKGBbQVRBXSBBZGRpbmcgJHtwYXRofSB0byBydW50aW1lYClcbiAgfVxuXG4gIGNvbnN0IGdldFR3b1NsYXNoQ29tcGxpZXJPcHRpb25zID0gZXh0cmFjdFR3b1NsYXNoQ29tcGxpZXJPcHRpb25zKHRzKVxuXG4gIC8vIEF1dG8tY29tcGxldGUgdHdvc2xhc2ggY29tbWVudHNcbiAgaWYgKGNvbmZpZy5zdXBwb3J0VHdvc2xhc2hDb21waWxlck9wdGlvbnMpIHtcbiAgICBjb25zdCBsYW5ncyA9IFtcImphdmFzY3JpcHRcIiwgXCJ0eXBlc2NyaXB0XCJdXG4gICAgbGFuZ3MuZm9yRWFjaChsID0+XG4gICAgICBtb25hY28ubGFuZ3VhZ2VzLnJlZ2lzdGVyQ29tcGxldGlvbkl0ZW1Qcm92aWRlcihsLCB7XG4gICAgICAgIHRyaWdnZXJDaGFyYWN0ZXJzOiBbXCJAXCIsIFwiL1wiLCBcIi1cIl0sXG4gICAgICAgIHByb3ZpZGVDb21wbGV0aW9uSXRlbXM6IHR3b3NsYXNoQ29tcGxldGlvbnModHMsIG1vbmFjbyksXG4gICAgICB9KVxuICAgIClcbiAgfVxuXG4gIGNvbnN0IHRleHRVcGRhdGVkID0gKCkgPT4ge1xuICAgIGNvbnN0IGNvZGUgPSBlZGl0b3IuZ2V0TW9kZWwoKSEuZ2V0VmFsdWUoKVxuXG4gICAgaWYgKGNvbmZpZy5zdXBwb3J0VHdvc2xhc2hDb21waWxlck9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IGNvbmZpZ09wdHMgPSBnZXRUd29TbGFzaENvbXBsaWVyT3B0aW9ucyhjb2RlKVxuICAgICAgdXBkYXRlQ29tcGlsZXJTZXR0aW5ncyhjb25maWdPcHRzKVxuICAgIH1cblxuICAgIGlmIChjb25maWcuYWNxdWlyZVR5cGVzKSB7XG4gICAgICBkZXRlY3ROZXdJbXBvcnRzVG9BY3F1aXJlVHlwZUZvcihjb2RlLCBhZGRMaWJyYXJ5VG9SdW50aW1lLCB3aW5kb3cuZmV0Y2guYmluZCh3aW5kb3cpLCBjb25maWcpXG4gICAgfVxuICB9XG5cbiAgLy8gRGVib3VuY2VkIHNhbmRib3ggZmVhdHVyZXMgbGlrZSB0d29zbGFzaCBhbmQgdHlwZSBhY3F1aXNpdGlvbiB0byBvbmNlIGV2ZXJ5IHNlY29uZFxuICBsZXQgZGVib3VuY2luZ1RpbWVyID0gZmFsc2VcbiAgZWRpdG9yLm9uRGlkQ2hhbmdlTW9kZWxDb250ZW50KF9lID0+IHtcbiAgICBpZiAoZGVib3VuY2luZ1RpbWVyKSByZXR1cm5cbiAgICBkZWJvdW5jaW5nVGltZXIgPSB0cnVlXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBkZWJvdW5jaW5nVGltZXIgPSBmYWxzZVxuICAgICAgdGV4dFVwZGF0ZWQoKVxuICAgIH0sIDEwMDApXG4gIH0pXG5cbiAgY29uZmlnLmxvZ2dlci5sb2coXCJbQ29tcGlsZXJdIFNldCBjb21waWxlciBvcHRpb25zOiBcIiwgY29tcGlsZXJPcHRpb25zKVxuICBkZWZhdWx0cy5zZXRDb21waWxlck9wdGlvbnMoY29tcGlsZXJPcHRpb25zKVxuXG4gIC8vIEdyYWIgdHlwZXMgbGFzdCBzbyB0aGF0IGl0IGxvZ3MgaW4gYSBsb2dpY2FsIHdheVxuICBpZiAoY29uZmlnLmFjcXVpcmVUeXBlcykge1xuICAgIC8vIFRha2UgdGhlIGNvZGUgZnJvbSB0aGUgZWRpdG9yIHJpZ2h0IGF3YXlcbiAgICBjb25zdCBjb2RlID0gZWRpdG9yLmdldE1vZGVsKCkhLmdldFZhbHVlKClcbiAgICBkZXRlY3ROZXdJbXBvcnRzVG9BY3F1aXJlVHlwZUZvcihjb2RlLCBhZGRMaWJyYXJ5VG9SdW50aW1lLCB3aW5kb3cuZmV0Y2guYmluZCh3aW5kb3cpLCBjb25maWcpXG4gIH1cblxuICAvLyBUbyBsZXQgY2xpZW50cyBwbHVnIGludG8gY29tcGlsZXIgc2V0dGluZ3MgY2hhbmdlc1xuICBsZXQgZGlkVXBkYXRlQ29tcGlsZXJTZXR0aW5ncyA9IChvcHRzOiBDb21waWxlck9wdGlvbnMpID0+IHt9XG5cbiAgY29uc3QgdXBkYXRlQ29tcGlsZXJTZXR0aW5ncyA9IChvcHRzOiBDb21waWxlck9wdGlvbnMpID0+IHtcbiAgICBjb25zdCBuZXdLZXlzID0gT2JqZWN0LmtleXMob3B0cylcbiAgICBpZiAoIW5ld0tleXMubGVuZ3RoKSByZXR1cm5cblxuICAgIC8vIERvbid0IHVwZGF0ZSBhIGNvbXBpbGVyIHNldHRpbmcgaWYgaXQncyB0aGUgc2FtZVxuICAgIC8vIGFzIHRoZSBjdXJyZW50IHNldHRpbmdcbiAgICBuZXdLZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIGlmIChjb21waWxlck9wdGlvbnNba2V5XSA9PSBvcHRzW2tleV0pIGRlbGV0ZSBvcHRzW2tleV1cbiAgICB9KVxuXG4gICAgaWYgKCFPYmplY3Qua2V5cyhvcHRzKS5sZW5ndGgpIHJldHVyblxuXG4gICAgY29uZmlnLmxvZ2dlci5sb2coXCJbQ29tcGlsZXJdIFVwZGF0aW5nIGNvbXBpbGVyIG9wdGlvbnM6IFwiLCBvcHRzKVxuXG4gICAgY29tcGlsZXJPcHRpb25zID0geyAuLi5jb21waWxlck9wdGlvbnMsIC4uLm9wdHMgfVxuICAgIGRlZmF1bHRzLnNldENvbXBpbGVyT3B0aW9ucyhjb21waWxlck9wdGlvbnMpXG4gICAgZGlkVXBkYXRlQ29tcGlsZXJTZXR0aW5ncyhjb21waWxlck9wdGlvbnMpXG4gIH1cblxuICBjb25zdCB1cGRhdGVDb21waWxlclNldHRpbmcgPSAoa2V5OiBrZXlvZiBDb21waWxlck9wdGlvbnMsIHZhbHVlOiBhbnkpID0+IHtcbiAgICBjb25maWcubG9nZ2VyLmxvZyhcIltDb21waWxlcl0gU2V0dGluZyBjb21waWxlciBvcHRpb25zIFwiLCBrZXksIFwidG9cIiwgdmFsdWUpXG4gICAgY29tcGlsZXJPcHRpb25zW2tleV0gPSB2YWx1ZVxuICAgIGRlZmF1bHRzLnNldENvbXBpbGVyT3B0aW9ucyhjb21waWxlck9wdGlvbnMpXG4gICAgZGlkVXBkYXRlQ29tcGlsZXJTZXR0aW5ncyhjb21waWxlck9wdGlvbnMpXG4gIH1cblxuICBjb25zdCBzZXRDb21waWxlclNldHRpbmdzID0gKG9wdHM6IENvbXBpbGVyT3B0aW9ucykgPT4ge1xuICAgIGNvbmZpZy5sb2dnZXIubG9nKFwiW0NvbXBpbGVyXSBTZXR0aW5nIGNvbXBpbGVyIG9wdGlvbnM6IFwiLCBvcHRzKVxuICAgIGNvbXBpbGVyT3B0aW9ucyA9IG9wdHNcbiAgICBkZWZhdWx0cy5zZXRDb21waWxlck9wdGlvbnMoY29tcGlsZXJPcHRpb25zKVxuICAgIGRpZFVwZGF0ZUNvbXBpbGVyU2V0dGluZ3MoY29tcGlsZXJPcHRpb25zKVxuICB9XG5cbiAgY29uc3QgZ2V0Q29tcGlsZXJPcHRpb25zID0gKCkgPT4ge1xuICAgIHJldHVybiBjb21waWxlck9wdGlvbnNcbiAgfVxuXG4gIGNvbnN0IHNldERpZFVwZGF0ZUNvbXBpbGVyU2V0dGluZ3MgPSAoZnVuYzogKG9wdHM6IENvbXBpbGVyT3B0aW9ucykgPT4gdm9pZCkgPT4ge1xuICAgIGRpZFVwZGF0ZUNvbXBpbGVyU2V0dGluZ3MgPSBmdW5jXG4gIH1cblxuICAvKiogR2V0cyB0aGUgcmVzdWx0cyBvZiBjb21waWxpbmcgeW91ciBlZGl0b3IncyBjb2RlICovXG4gIGNvbnN0IGdldEVtaXRSZXN1bHQgPSBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgbW9kZWwgPSBlZGl0b3IuZ2V0TW9kZWwoKSFcblxuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IGdldFdvcmtlclByb2Nlc3MoKVxuICAgIHJldHVybiBhd2FpdCBjbGllbnQuZ2V0RW1pdE91dHB1dChtb2RlbC51cmkudG9TdHJpbmcoKSlcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBKUyAgb2YgY29tcGlsaW5nIHlvdXIgZWRpdG9yJ3MgY29kZSAqL1xuICBjb25zdCBnZXRSdW5uYWJsZUpTID0gYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGdldEVtaXRSZXN1bHQoKVxuICAgIGNvbnN0IGZpcnN0SlMgPSByZXN1bHQub3V0cHV0RmlsZXMuZmluZCgobzogYW55KSA9PiBvLm5hbWUuZW5kc1dpdGgoXCIuanNcIikgfHwgby5uYW1lLmVuZHNXaXRoKFwiLmpzeFwiKSlcbiAgICByZXR1cm4gKGZpcnN0SlMgJiYgZmlyc3RKUy50ZXh0KSB8fCBcIlwiXG4gIH1cblxuICAvKiogR2V0cyB0aGUgRFRTIGZvciB0aGUgSlMvVFMgIG9mIGNvbXBpbGluZyB5b3VyIGVkaXRvcidzIGNvZGUgKi9cbiAgY29uc3QgZ2V0RFRTRm9yQ29kZSA9IGFzeW5jICgpID0+IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBnZXRFbWl0UmVzdWx0KClcbiAgICByZXR1cm4gcmVzdWx0Lm91dHB1dEZpbGVzLmZpbmQoKG86IGFueSkgPT4gby5uYW1lLmVuZHNXaXRoKFwiLmQudHNcIikpIS50ZXh0XG4gIH1cblxuICBjb25zdCBnZXRXb3JrZXJQcm9jZXNzID0gYXN5bmMgKCk6IFByb21pc2U8VHlwZVNjcmlwdFdvcmtlcj4gPT4ge1xuICAgIGNvbnN0IHdvcmtlciA9IGF3YWl0IGdldFdvcmtlcigpXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHJldHVybiBhd2FpdCB3b3JrZXIobW9kZWwudXJpKVxuICB9XG5cbiAgY29uc3QgZ2V0RG9tTm9kZSA9ICgpID0+IGVkaXRvci5nZXREb21Ob2RlKCkhXG4gIGNvbnN0IGdldE1vZGVsID0gKCkgPT4gZWRpdG9yLmdldE1vZGVsKCkhXG4gIGNvbnN0IGdldFRleHQgPSAoKSA9PiBnZXRNb2RlbCgpLmdldFZhbHVlKClcbiAgY29uc3Qgc2V0VGV4dCA9ICh0ZXh0OiBzdHJpbmcpID0+IGdldE1vZGVsKCkuc2V0VmFsdWUodGV4dClcblxuICBjb25zdCBzZXR1cFRTVkZTID0gYXN5bmMgKGZzTWFwQWRkaXRpb25zPzogTWFwPHN0cmluZywgc3RyaW5nPikgPT4ge1xuICAgIGNvbnN0IGZzTWFwID0gYXdhaXQgdHN2ZnMuY3JlYXRlRGVmYXVsdE1hcEZyb21DRE4oY29tcGlsZXJPcHRpb25zLCB0cy52ZXJzaW9uLCB0cnVlLCB0cywgbHpzdHJpbmcpXG4gICAgZnNNYXAuc2V0KGZpbGVQYXRoLnBhdGgsIGdldFRleHQoKSlcbiAgICBpZiAoZnNNYXBBZGRpdGlvbnMpIHtcbiAgICAgIGZzTWFwQWRkaXRpb25zLmZvckVhY2goKHYsIGspID0+IGZzTWFwLnNldChrLCB2KSlcbiAgICB9XG5cbiAgICBjb25zdCBzeXN0ZW0gPSB0c3Zmcy5jcmVhdGVTeXN0ZW0oZnNNYXApXG4gICAgY29uc3QgaG9zdCA9IHRzdmZzLmNyZWF0ZVZpcnR1YWxDb21waWxlckhvc3Qoc3lzdGVtLCBjb21waWxlck9wdGlvbnMsIHRzKVxuXG4gICAgY29uc3QgcHJvZ3JhbSA9IHRzLmNyZWF0ZVByb2dyYW0oe1xuICAgICAgcm9vdE5hbWVzOiBbLi4uZnNNYXAua2V5cygpXSxcbiAgICAgIG9wdGlvbnM6IGNvbXBpbGVyT3B0aW9ucyxcbiAgICAgIGhvc3Q6IGhvc3QuY29tcGlsZXJIb3N0LFxuICAgIH0pXG5cbiAgICByZXR1cm4ge1xuICAgICAgcHJvZ3JhbSxcbiAgICAgIHN5c3RlbSxcbiAgICAgIGhvc3QsXG4gICAgICBmc01hcCxcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFRTIFByb2dyYW0sIGlmIHlvdSdyZSBkb2luZyBhbnl0aGluZyBjb21wbGV4XG4gICAqIGl0J3MgbGlrZWx5IHlvdSB3YW50IHNldHVwVFNWRlMgaW5zdGVhZCBhbmQgY2FuIHB1bGwgcHJvZ3JhbSBvdXQgZnJvbSB0aGF0XG4gICAqXG4gICAqIFdhcm5pbmc6IFJ1bnMgb24gdGhlIG1haW4gdGhyZWFkXG4gICAqL1xuICBjb25zdCBjcmVhdGVUU1Byb2dyYW0gPSBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgdHN2ZnMgPSBhd2FpdCBzZXR1cFRTVkZTKClcbiAgICByZXR1cm4gdHN2ZnMucHJvZ3JhbVxuICB9XG5cbiAgY29uc3QgZ2V0QVNUID0gYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHByb2dyYW0gPSBhd2FpdCBjcmVhdGVUU1Byb2dyYW0oKVxuICAgIHByb2dyYW0uZW1pdCgpXG4gICAgcmV0dXJuIHByb2dyYW0uZ2V0U291cmNlRmlsZShmaWxlUGF0aC5wYXRoKSFcbiAgfVxuXG4gIC8vIFBhc3MgYWxvbmcgdGhlIHN1cHBvcnRlZCByZWxlYXNlcyBmb3IgdGhlIHBsYXlncm91bmRcbiAgY29uc3Qgc3VwcG9ydGVkVmVyc2lvbnMgPSBzdXBwb3J0ZWRSZWxlYXNlc1xuXG4gIHRleHRVcGRhdGVkKClcblxuICByZXR1cm4ge1xuICAgIC8qKiBUaGUgc2FtZSBjb25maWcgeW91IHBhc3NlZCBpbiAqL1xuICAgIGNvbmZpZyxcbiAgICAvKiogQSBsaXN0IG9mIFR5cGVTY3JpcHQgdmVyc2lvbnMgeW91IGNhbiB1c2Ugd2l0aCB0aGUgVHlwZVNjcmlwdCBzYW5kYm94ICovXG4gICAgc3VwcG9ydGVkVmVyc2lvbnMsXG4gICAgLyoqIFRoZSBtb25hY28gZWRpdG9yIGluc3RhbmNlICovXG4gICAgZWRpdG9yLFxuICAgIC8qKiBFaXRoZXIgXCJ0eXBlc2NyaXB0XCIgb3IgXCJqYXZhc2NyaXB0XCIgZGVwZW5kaW5nIG9uIHlvdXIgY29uZmlnICovXG4gICAgbGFuZ3VhZ2UsXG4gICAgLyoqIFRoZSBvdXRlciBtb25hY28gbW9kdWxlLCB0aGUgcmVzdWx0IG9mIHJlcXVpcmUoXCJtb25hY28tZWRpdG9yXCIpICAqL1xuICAgIG1vbmFjbyxcbiAgICAvKiogR2V0cyBhIG1vbmFjby10eXBlc2NyaXB0IHdvcmtlciwgdGhpcyB3aWxsIGdpdmUgeW91IGFjY2VzcyB0byBhIGxhbmd1YWdlIHNlcnZlci4gTm90ZTogcHJlZmVyIHRoaXMgZm9yIGxhbmd1YWdlIHNlcnZlciB3b3JrIGJlY2F1c2UgaXQgaGFwcGVucyBvbiBhIHdlYndvcmtlciAuICovXG4gICAgZ2V0V29ya2VyUHJvY2VzcyxcbiAgICAvKiogQSBjb3B5IG9mIHJlcXVpcmUoXCJAdHlwZXNjcmlwdC92ZnNcIikgdGhpcyBjYW4gYmUgdXNlZCB0byBxdWlja2x5IHNldCB1cCBhbiBpbi1tZW1vcnkgY29tcGlsZXIgcnVucyBmb3IgQVNUcywgb3IgdG8gZ2V0IGNvbXBsZXggbGFuZ3VhZ2Ugc2VydmVyIHJlc3VsdHMgKGFueXRoaW5nIGFib3ZlIGhhcyB0byBiZSBzZXJpYWxpemVkIHdoZW4gcGFzc2VkKSovXG4gICAgdHN2ZnMsXG4gICAgLyoqIEdldCBhbGwgdGhlIGRpZmZlcmVudCBlbWl0dGVkIGZpbGVzIGFmdGVyIFR5cGVTY3JpcHQgaXMgcnVuICovXG4gICAgZ2V0RW1pdFJlc3VsdCxcbiAgICAvKiogR2V0cyBqdXN0IHRoZSBKYXZhU2NyaXB0IGZvciB5b3VyIHNhbmRib3gsIHdpbGwgdHJhbnNwaWxlIGlmIGluIFRTIG9ubHkgKi9cbiAgICBnZXRSdW5uYWJsZUpTLFxuICAgIC8qKiBHZXRzIHRoZSBEVFMgb3V0cHV0IG9mIHRoZSBtYWluIGNvZGUgaW4gdGhlIGVkaXRvciAqL1xuICAgIGdldERUU0ZvckNvZGUsXG4gICAgLyoqIFRoZSBtb25hY28tZWRpdG9yIGRvbSBub2RlLCB1c2VkIGZvciBzaG93aW5nL2hpZGluZyB0aGUgZWRpdG9yICovXG4gICAgZ2V0RG9tTm9kZSxcbiAgICAvKiogVGhlIG1vZGVsIGlzIGFuIG9iamVjdCB3aGljaCBtb25hY28gdXNlcyB0byBrZWVwIHRyYWNrIG9mIHRleHQgaW4gdGhlIGVkaXRvci4gVXNlIHRoaXMgdG8gZGlyZWN0bHkgbW9kaWZ5IHRoZSB0ZXh0IGluIHRoZSBlZGl0b3IgKi9cbiAgICBnZXRNb2RlbCxcbiAgICAvKiogR2V0cyB0aGUgdGV4dCBvZiB0aGUgbWFpbiBtb2RlbCwgd2hpY2ggaXMgdGhlIHRleHQgaW4gdGhlIGVkaXRvciAqL1xuICAgIGdldFRleHQsXG4gICAgLyoqIFNob3J0Y3V0IGZvciBzZXR0aW5nIHRoZSBtb2RlbCdzIHRleHQgY29udGVudCB3aGljaCB3b3VsZCB1cGRhdGUgdGhlIGVkaXRvciAqL1xuICAgIHNldFRleHQsXG4gICAgLyoqIEdldHMgdGhlIEFTVCBvZiB0aGUgY3VycmVudCB0ZXh0IGluIG1vbmFjbyAtIHVzZXMgYGNyZWF0ZVRTUHJvZ3JhbWAsIHNvIHRoZSBwZXJmb3JtYW5jZSBjYXZlYXQgYXBwbGllcyB0aGVyZSB0b28gKi9cbiAgICBnZXRBU1QsXG4gICAgLyoqIFRoZSBtb2R1bGUgeW91IGdldCBmcm9tIHJlcXVpcmUoXCJ0eXBlc2NyaXB0XCIpICovXG4gICAgdHMsXG4gICAgLyoqIENyZWF0ZSBhIG5ldyBQcm9ncmFtLCBhIFR5cGVTY3JpcHQgZGF0YSBtb2RlbCB3aGljaCByZXByZXNlbnRzIHRoZSBlbnRpcmUgcHJvamVjdC4gQXMgd2VsbCBhcyBzb21lIG9mIHRoZVxuICAgICAqIHByaW1pdGl2ZSBvYmplY3RzIHlvdSB3b3VsZCBub3JtYWxseSBuZWVkIHRvIGRvIHdvcmsgd2l0aCB0aGUgZmlsZXMuXG4gICAgICpcbiAgICAgKiBUaGUgZmlyc3QgdGltZSB0aGlzIGlzIGNhbGxlZCBpdCBoYXMgdG8gZG93bmxvYWQgYWxsIHRoZSBEVFMgZmlsZXMgd2hpY2ggaXMgbmVlZGVkIGZvciBhbiBleGFjdCBjb21waWxlciBydW4uIFdoaWNoXG4gICAgICogYXQgbWF4IGlzIGFib3V0IDEuNU1CIC0gYWZ0ZXIgdGhhdCBzdWJzZXF1ZW50IGRvd25sb2FkcyBvZiBkdHMgbGliIGZpbGVzIGNvbWUgZnJvbSBsb2NhbFN0b3JhZ2UuXG4gICAgICpcbiAgICAgKiBUcnkgdG8gdXNlIHRoaXMgc3BhcmluZ2x5IGFzIGl0IGNhbiBiZSBjb21wdXRhdGlvbmFsbHkgZXhwZW5zaXZlLCBhdCB0aGUgbWluaW11bSB5b3Ugc2hvdWxkIGJlIHVzaW5nIHRoZSBkZWJvdW5jZWQgc2V0dXAuXG4gICAgICpcbiAgICAgKiBBY2NlcHRzIGFuIG9wdGlvbmFsIGZzTWFwIHdoaWNoIHlvdSBjYW4gdXNlIHRvIGFkZCBhbnkgZmlsZXMsIG9yIG92ZXJ3cml0ZSB0aGUgZGVmYXVsdCBmaWxlLlxuICAgICAqXG4gICAgICogVE9ETzogSXQgd291bGQgYmUgZ29vZCB0byBjcmVhdGUgYW4gZWFzeSB3YXkgdG8gaGF2ZSBhIHNpbmdsZSBwcm9ncmFtIGluc3RhbmNlIHdoaWNoIGlzIHVwZGF0ZWQgZm9yIHlvdVxuICAgICAqIHdoZW4gdGhlIG1vbmFjbyBtb2RlbCBjaGFuZ2VzLlxuICAgICAqL1xuICAgIHNldHVwVFNWRlMsXG4gICAgLyoqIFVzZXMgdGhlIGFib3ZlIGNhbGwgc2V0dXBUU1ZGUywgYnV0IG9ubHkgcmV0dXJucyB0aGUgcHJvZ3JhbSAqL1xuICAgIGNyZWF0ZVRTUHJvZ3JhbSxcbiAgICAvKiogVGhlIFNhbmRib3gncyBkZWZhdWx0IGNvbXBpbGVyIG9wdGlvbnMgICovXG4gICAgY29tcGlsZXJEZWZhdWx0cyxcbiAgICAvKiogVGhlIFNhbmRib3gncyBjdXJyZW50IGNvbXBpbGVyIG9wdGlvbnMgKi9cbiAgICBnZXRDb21waWxlck9wdGlvbnMsXG4gICAgLyoqIFJlcGxhY2UgdGhlIFNhbmRib3gncyBjb21waWxlciBvcHRpb25zICovXG4gICAgc2V0Q29tcGlsZXJTZXR0aW5ncyxcbiAgICAvKiogT3ZlcndyaXRlIHRoZSBTYW5kYm94J3MgY29tcGlsZXIgb3B0aW9ucyAqL1xuICAgIHVwZGF0ZUNvbXBpbGVyU2V0dGluZyxcbiAgICAvKiogVXBkYXRlIGEgc2luZ2xlIGNvbXBpbGVyIG9wdGlvbiBpbiB0aGUgU0FuZGJveCAqL1xuICAgIHVwZGF0ZUNvbXBpbGVyU2V0dGluZ3MsXG4gICAgLyoqIEEgd2F5IHRvIGdldCBjYWxsYmFja3Mgd2hlbiBjb21waWxlciBzZXR0aW5ncyBoYXZlIGNoYW5nZWQgKi9cbiAgICBzZXREaWRVcGRhdGVDb21waWxlclNldHRpbmdzLFxuICAgIC8qKiBBIGNvcHkgb2YgbHpzdHJpbmcsIHdoaWNoIGlzIHVzZWQgdG8gYXJjaGl2ZS91bmFyY2hpdmUgY29kZSAqL1xuICAgIGx6c3RyaW5nLFxuICAgIC8qKiBSZXR1cm5zIGNvbXBpbGVyIG9wdGlvbnMgZm91bmQgaW4gdGhlIHBhcmFtcyBvZiB0aGUgY3VycmVudCBwYWdlICovXG4gICAgY3JlYXRlVVJMUXVlcnlXaXRoQ29tcGlsZXJPcHRpb25zLFxuICAgIC8qKiBSZXR1cm5zIGNvbXBpbGVyIG9wdGlvbnMgaW4gdGhlIHNvdXJjZSBjb2RlIHVzaW5nIHR3b3NsYXNoIG5vdGF0aW9uICovXG4gICAgZ2V0VHdvU2xhc2hDb21wbGllck9wdGlvbnMsXG4gICAgLyoqIEdldHMgdG8gdGhlIGN1cnJlbnQgbW9uYWNvLWxhbmd1YWdlLCB0aGlzIGlzIGhvdyB5b3UgdGFsayB0byB0aGUgYmFja2dyb3VuZCB3ZWJ3b3JrZXJzICovXG4gICAgbGFuZ3VhZ2VTZXJ2aWNlRGVmYXVsdHM6IGRlZmF1bHRzLFxuICAgIC8qKiBUaGUgcGF0aCB3aGljaCByZXByZXNlbnRzIHRoZSBjdXJyZW50IGZpbGUgdXNpbmcgdGhlIGN1cnJlbnQgY29tcGlsZXIgb3B0aW9ucyAqL1xuICAgIGZpbGVwYXRoOiBmaWxlUGF0aC5wYXRoLFxuICAgIC8qKiBBZGRzIGEgZmlsZSB0byB0aGUgdmZzIHVzZWQgYnkgdGhlIGVkaXRvciAqL1xuICAgIGFkZExpYnJhcnlUb1J1bnRpbWUsXG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgU2FuZGJveCA9IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZVR5cGVTY3JpcHRTYW5kYm94PlxuIl19