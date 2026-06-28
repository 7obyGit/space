export function Command(path: string | symbol | any[], description?: string) {
    return (constructor: any) => {
        constructor.paths = Array.isArray(path) ? [path] : [[path]];
        if (description) {
            constructor.usage = constructor.Usage?.({ description });
        }
    };
}
