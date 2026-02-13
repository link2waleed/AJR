import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../theme';

const { width: screenWidth } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;

/**
 * AJR Rings Component - Reusable circular progress visualization
 * Shows 3 concentric rings with separators and center percentage
 */
const AJRRings = ({
    progress = 45,
    layer1Completed = false,
    layer2Completed = false,
    layer3Completed = false,
    layer1Visible = true,
    layer2Visible = true,
    layer3Visible = true,
    journalingVisible = true,
    layer1Progress,
    layer2Progress,
    layer3Progress,
    journalingProgress,
    variant = 'default' // 'default' (Home) or 'detailed' (Daily Growth)
}) => {
    const baseSize = isSmallDevice ? 155 : 175;
    // Increase size for detailed variant to fit percentage text better
    const size = variant === 'detailed' ? (isSmallDevice ? 200 : 230) : baseSize;
    const center = size / 2;

    // Ring configuration matching exact design
    const strokeWidth = isSmallDevice ? 8 : 10;
    const separatorWidth = isSmallDevice ? 8 : 10;

    // Helper to determine progress value (0-100)
    const getProgress = (explicit, completed) => {
        if (typeof explicit !== 'undefined') return Math.min(100, Math.max(0, explicit));
        return completed ? 100 : 0;
    };

    // Identify active layers to stack them sequentially
    const activeLayers = [];
    if (layer1Visible) activeLayers.push({
        id: 'l1',
        color: colors.rings.layer1,
        progress: getProgress(layer1Progress, layer1Completed)
    });
    if (layer2Visible) activeLayers.push({
        id: 'l2',
        color: colors.rings.layer2,
        progress: getProgress(layer2Progress, layer2Completed)
    });
    if (layer3Visible) activeLayers.push({
        id: 'l3',
        color: colors.rings.layer3,
        progress: getProgress(layer3Progress, layer3Completed)
    });

    // Journaling Logic
    if (journalingVisible && variant === 'detailed') {
        // In detailed mode, Journaling is the 4th ring
        activeLayers.push({
            id: 'l4',
            color: colors.rings.innerCircle,
            progress: getProgress(journalingProgress, false)
        });
    }

    // Base radius (Outer slot)
    const baseRadius = center - strokeWidth / 2;
    const maxLayers = (variant === 'detailed') ? 4 : 3;
    const shift = maxLayers - activeLayers.length;

    // Calculate Inner Circle Radius (for default mode)
    let lastRingPosition = 0;
    if (activeLayers.length > 0) {
        // The innermost ring is at the last index + shift
        const innermostIndex = (activeLayers.length - 1) + shift;
        lastRingPosition = baseRadius - innermostIndex * (strokeWidth + separatorWidth);
    } else {
        lastRingPosition = baseRadius;
    }
    const innerCircleRadius = lastRingPosition * 0.70;

    const tickSize = 12;

    return (
        <View style={styles.ringsContainer}>
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${center}, ${center}`}>
                    {/* Render Stacked Rings */}
                    {activeLayers.map((layer, index) => {
                        // Apply shift to align rings inwards 
                        const effectiveIndex = index + shift;
                        const r = baseRadius - effectiveIndex * (strokeWidth + separatorWidth);
                        const circumference = 2 * Math.PI * r;
                        const progressOffset = circumference - (layer.progress / 100) * circumference;

                        return (
                            <React.Fragment key={layer.id}>
                                {/* Background Track (Only for detailed variant) */}
                                {variant === 'detailed' && (
                                    <Circle
                                        cx={center}
                                        cy={center}
                                        r={r}
                                        stroke={layer.color}
                                        strokeWidth={strokeWidth}
                                        strokeOpacity={0.2}
                                        fill="none"
                                    />
                                )}


                                {/* Progress Ring */}
                                {variant === 'detailed' ? (
                                    <Circle
                                        cx={center}
                                        cy={center}
                                        r={r}
                                        stroke={layer.color}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={circumference}
                                        strokeDashoffset={progressOffset}
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                ) : (
                                    // Default variant: Render full circle (like before)
                                    <Circle
                                        cx={center}
                                        cy={center}
                                        r={r}
                                        stroke={layer.color}
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}

                    {/* Inner Circle (Filled) - Only for default variant */}
                    {variant === 'default' && journalingVisible && (
                        <Circle
                            cx={center}
                            cy={center}
                            r={innerCircleRadius}
                            fill={colors.rings.innerCircle}
                        />
                    )}
                </G>
            </Svg>

            {/* Checkmarks for completed layers - Positioned at top (12 o'clock) */}


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
    tickContainer: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
});

export default AJRRings;
