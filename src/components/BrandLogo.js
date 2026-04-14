import React from 'react';
import { View, Image, StyleSheet, PixelRatio, useWindowDimensions } from 'react-native';

const px = (value) => PixelRatio.roundToNearestPixel(value);

const BrandLogo = ({ size }) => {
    const { width } = useWindowDimensions();
    const isSmallDevice = width < 375;
    const isMediumDevice = width < 414;
    
    const defaultSize = isSmallDevice ? 110 : isMediumDevice ? 120 : 140;
    const finalSize = size || defaultSize;
    const scale = finalSize / 120;

    const iconSize = px(64 * scale);
    const moonSize = iconSize;
    const leafSize = px(34 * scale);

    const letterHeight = px(24 * scale);
    const letterAWidth = px(22 * scale);
    const letterJWidth = px(14 * scale);
    const letterRWidth = px(22 * scale);
    const letterSpacing = px(6 * scale);
    const iconLetterGap = px(2 * scale);

    return (
        <View style={styles.container}>
            {/* Icon */}
            <View style={[styles.iconContainer, { width: iconSize, height: iconSize }]}>
                <Image
                    source={require('../../assets/images/moon.png')}
                    style={[
                        styles.image,
                        {
                            width: moonSize,
                            height: moonSize,
                        },
                    ]}
                    resizeMode="contain"
                />

                <Image
                    source={require('../../assets/images/leaf.png')}
                    style={[
                        styles.image,
                        {
                            width: leafSize,
                            height: leafSize,
                            top: px(iconSize * 0.22),
                            left: px(iconSize * 0.30),
                        },
                    ]}
                    resizeMode="contain"
                />
            </View>

            {/* Letters */}
            <View style={[styles.lettersRow, { marginTop: iconLetterGap }]}>
                <Image
                    source={require('../../assets/images/A.png')}
                    style={[styles.image, { width: letterAWidth, height: letterHeight }]}
                    resizeMode="contain"
                />

                <View style={{ width: letterSpacing }} />

                <Image
                    source={require('../../assets/images/J.png')}
                    style={[styles.image, { width: letterJWidth, height: letterHeight }]}
                    resizeMode="contain"
                />

                <View style={{ width: letterSpacing }} />

                <Image
                    source={require('../../assets/images/R.png')}
                    style={[styles.image, { width: letterRWidth, height: letterHeight }]}
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
        marginBottom: 4,
    },
    lettersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        position: 'absolute',

        // 🔥 Key for sharpness during animation
        shouldRasterizeIOS: true,
        renderToHardwareTextureAndroid: true,

        // Prevent subtle blur from transforms
        transform: [{ translateX: 0 }, { translateY: 0 }],
    },
});

export default BrandLogo;