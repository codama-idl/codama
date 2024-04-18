type Version = `${number}.${number}.${number}`;

export function getVersion(): Version {
    return __VERSION__ as Version;
}
