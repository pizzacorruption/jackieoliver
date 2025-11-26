/**
 * tree/content.js - Text content displayed on the tree
 *
 * Each section has:
 * - str: The heading text
 * - x, y, z: 3D position (y increases going up the tree)
 * - detail: Smaller subtitle text
 *
 * Positions are tuned so text faces outward from the trunk.
 * Edit these to change what appears in tree mode.
 */

export const texts = [
    {
        str: "Where I Stand",
        x: 18.00, y: 5.00, z: 0.00,
        detail: [
            "Standing on the shoulders of giants.",
            "Thousands of years of accumulated progress",
            "made this moment possible."
        ]
    },
    {
        str: "What I Make",
        x: -15.79, y: 29.00, z: 0.20,
        detail: [
            "I build products, models, and strategy.",
            "Tools that extend what people can do."
        ]
    },
    {
        str: "What I Carry",
        x: 16.73, y: 55.00, z: 0.36,
        detail: [
            "What makes a good life when labor has no value?",
            "Are we post-ideology?",
            "How many geniuses were lost to circumstance?"
        ]
    },
    {
        str: "What I Believe",
        x: -17.77, y: 79.00, z: -0.03,
        detail: [
            "Technology does not change the hardware -",
            "it changes what hardware can accomplish.",
            "Writing let average intelligence",
            "accumulate across generations."
        ]
    },
    {
        str: "Find Me",
        x: 18.00, y: 104.00, z: 0.00,
        detail: ["jroliver02@gmail.com"]
    }
];
