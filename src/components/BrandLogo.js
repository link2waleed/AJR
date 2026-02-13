import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const BrandLogo = ({ size = 120 }) => {
    // Scale everything relative to the base size of 120
    const scale = size / 120;

    // Moon + leaf icon area (top portion)
    const iconSize = 70 * scale;
    const moonSize = iconSize;
    const leafSize = 38 * scale;

    // Letter sizes (bottom portion)
    const letterHeight = 28 * scale;
    const letterAWidth = 26 * scale;
    const letterJWidth = 16 * scale;
    const letterRWidth = 26 * scale;
    const letterSpacing = 8 * scale;
    const iconLetterGap = 4 * scale;

    return (
        <View style={styles.container}>
            {/* Moon + Leaf icon */}
            <View style={[styles.iconContainer, { width: iconSize, height: iconSize }]}>
                <Image
                    source={require('../../assets/images/moon.png')}
                    style={[styles.moon, { width: moonSize, height: moonSize }]}
                    resizeMode="contain"
                />
                <Image
                    source={require('../../assets/images/leaf.png')}
                    style={[
                        styles.leaf,
                        {
                            width: leafSize,
                            height: leafSize,
                            top: iconSize * 0.2,
                            left: iconSize * 0.28,
                        },
                    ]}
                    resizeMode="contain"
                />
            </View>

            {/* A J R letters */}
            <View style={[styles.lettersRow, { marginTop: iconLetterGap }]}>
                <Image
                    source={require('../../assets/images/A.png')}
                    style={{ width: letterAWidth, height: letterHeight }}
                    resizeMode="contain"
                />
                <View style={{ width: letterSpacing }} />
                <Image
                    source={require('../../assets/images/J.png')}
                    style={{ width: letterJWidth, height: letterHeight }}
                    resizeMode="contain"
                />
                <View style={{ width: letterSpacing }} />
                <Image
                    source={require('../../assets/images/R.png')}
                    style={{ width: letterRWidth, height: letterHeight }}
                    resizeMode="contain"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    iconContainer: {
        position: 'relative',
        marginBottom: 8
    },
    moon: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    leaf: {
        position: 'absolute',
    },
    lettersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default BrandLogo;
