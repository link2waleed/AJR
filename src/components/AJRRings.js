import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, spacing } from '../theme';

const { width: screenWidth } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;

/**
 * AJR Rings Component - Reusable circular progress visualization
 * Shows 3 concentric rings with separators and center percentage
 */
const AJRRings = ({ progress = 45, activities }) => {
    const size = isSmallDevice ? 155 : 175;
    const center = size / 2;

    // Ring configuration matching exact design
    const strokeWidth = isSmallDevice ? 8 : 10;
    const separatorWidth = isSmallDevice ? 8 : 10;

    // Calculate radii for 3 layers with separators
    const layer1Radius = center - strokeWidth / 2;
    const layer2Radius = layer1Radius - strokeWidth - separatorWidth;
    const layer3Radius = layer2Radius - strokeWidth - separatorWidth;
    const innerCircleRadius = layer3Radius * 0.70;

    return (
        <View style={styles.ringsContainer}>
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${center}, ${center}`}>
                    {/* Layer 1 - Outer (Green) */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={layer1Radius}
                        stroke={colors.rings.layer1}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />

                    {/* Separator 1 */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={layer1Radius - strokeWidth / 2 - separatorWidth / 2}
                        stroke={colors.rings.separator}
                        strokeWidth={separatorWidth}
                        fill="none"
                    />

                    {/* Layer 2 (Gold) */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={layer2Radius}
                        stroke={colors.rings.layer2}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />

                    {/* Separator 2 */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={layer2Radius - strokeWidth / 2 - separatorWidth / 2}
                        stroke={colors.rings.separator}
                        strokeWidth={separatorWidth}
                        fill="none"
                    />

                    {/* Layer 3 (Darker Gold) */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={layer3Radius}
                        stroke={colors.rings.layer3}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />

                    {/* Separator 3 (before inner circle) */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={layer3Radius - strokeWidth / 2 - separatorWidth / 2}
                        stroke={colors.rings.separator}
                        strokeWidth={separatorWidth}
                        fill="none"
                    />

                    {/* Inner Circle (Teal) */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={innerCircleRadius}
                        fill={colors.rings.innerCircle}
                    />
                </G>
            </Svg>
            {/* Center text */}
            <View style={styles.ringsCenterText}>
                <Text style={styles.ringsPercentage}>{progress}%</Text>
                <Text style={styles.ringsLabel}>Complete</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    ringsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    ringsCenterText: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringsPercentage: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: 'bold',
        color: colors.text.black,
    },
    ringsLabel: {
        fontSize: isSmallDevice ? 9 : 10,
        color: colors.text.black,
    },
});

export default AJRRings;
