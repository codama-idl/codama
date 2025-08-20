export type RenderOptions = RenderMapOptions & {
    deleteFolderBeforeRendering?: boolean;
};

export type RenderMapOptions = {
    extension?: string;
    indexFilename?: string;
    typeIndent?: string;
};
