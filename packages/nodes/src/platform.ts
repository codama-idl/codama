type Platform = 'browser' | 'node' | 'react-native';

export function getPlatform(): Platform {
    if (__BROWSER__) return 'browser';
    if (__REACTNATIVE__) return 'react-native';
    return 'node';
}
