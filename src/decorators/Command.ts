export function Command(path: string, description?: string) {
    return (constructor: any) => {
        constructor.paths = [[path]];
        if (description) {
            constructor.usage = constructor.Usage?.({ description });
        }
    };
}
