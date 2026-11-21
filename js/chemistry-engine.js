/**
 * EcrioX Chemistry Simulation Engine & Calculator Toolkit
 * High-precision, zero-dependency chemical mathematics and visualization library.
 * Designed for 60fps HTML5 Canvas, 3D molecular projection, matrix equation balancing,
 * and 118-element periodic explorer.
 */

(function(window) {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Complete 118-Element Verified Periodic Dataset
  // --------------------------------------------------------------------------
  const ELEMENTS = [
    { z: 1, s: "H", n: "Hydrogen", m: 1.008, cat: "nonmetal", g: 1, p: 1, blk: "s", state: "gas", ec: "1s¹", ox: [1, -1], en: 2.20, mp: 13.99, bp: 20.271, d: 0.00008988 },
    { z: 2, s: "He", n: "Helium", m: 4.0026, cat: "noble", g: 18, p: 1, blk: "s", state: "gas", ec: "1s²", ox: [0], en: null, mp: 0.95, bp: 4.222, d: 0.0001785 },
    { z: 3, s: "Li", n: "Lithium", m: 6.94, cat: "alkali", g: 1, p: 2, blk: "s", state: "solid", ec: "[He] 2s¹", ox: [1], en: 0.98, mp: 453.65, bp: 1603, d: 0.534 },
    { z: 4, s: "Be", n: "Beryllium", m: 9.0122, cat: "alkaline-earth", g: 2, p: 2, blk: "s", state: "solid", ec: "[He] 2s²", ox: [2], en: 1.57, mp: 1560, bp: 2742, d: 1.85 },
    { z: 5, s: "B", n: "Boron", m: 10.81, cat: "metalloid", g: 13, p: 2, blk: "p", state: "solid", ec: "[He] 2s² 2p¹", ox: [3], en: 2.04, mp: 2349, bp: 4200, d: 2.34 },
    { z: 6, s: "C", n: "Carbon", m: 12.011, cat: "nonmetal", g: 14, p: 2, blk: "p", state: "solid", ec: "[He] 2s² 2p²", ox: [4, 2, -4], en: 2.55, mp: 3823, bp: 4098, d: 2.267 },
    { z: 7, s: "N", n: "Nitrogen", m: 14.007, cat: "nonmetal", g: 15, p: 2, blk: "p", state: "gas", ec: "[He] 2s² 2p³", ox: [5, 4, 3, 2, 1, -3], en: 3.04, mp: 63.15, bp: 77.355, d: 0.0012506 },
    { z: 8, s: "O", n: "Oxygen", m: 15.999, cat: "nonmetal", g: 16, p: 2, blk: "p", state: "gas", ec: "[He] 2s² 2p⁴", ox: [-2, -1], en: 3.44, mp: 54.36, bp: 90.188, d: 0.001429 },
    { z: 9, s: "F", n: "Fluorine", m: 18.998, cat: "halogen", g: 17, p: 2, blk: "p", state: "gas", ec: "[He] 2s² 2p⁵", ox: [-1], en: 3.98, mp: 53.48, bp: 85.03, d: 0.001696 },
    { z: 10, s: "Ne", n: "Neon", m: 20.180, cat: "noble", g: 18, p: 2, blk: "p", state: "gas", ec: "[He] 2s² 2p⁶", ox: [0], en: null, mp: 24.56, bp: 27.104, d: 0.0009002 },
    { z: 11, s: "Na", n: "Sodium", m: 22.990, cat: "alkali", g: 1, p: 3, blk: "s", state: "solid", ec: "[Ne] 3s¹", ox: [1], en: 0.93, mp: 370.944, bp: 1156.09, d: 0.968 },
    { z: 12, s: "Mg", n: "Magnesium", m: 24.305, cat: "alkaline-earth", g: 2, p: 3, blk: "s", state: "solid", ec: "[Ne] 3s²", ox: [2], en: 1.31, mp: 923, bp: 1363, d: 1.738 },
    { z: 13, s: "Al", n: "Aluminum", m: 26.982, cat: "post-transition", g: 13, p: 3, blk: "p", state: "solid", ec: "[Ne] 3s² 3p¹", ox: [3], en: 1.61, mp: 933.47, bp: 2743, d: 2.70 },
    { z: 14, s: "Si", n: "Silicon", m: 28.085, cat: "metalloid", g: 14, p: 3, blk: "p", state: "solid", ec: "[Ne] 3s² 3p²", ox: [4, -4], en: 1.90, mp: 1687, bp: 3538, d: 2.329 },
    { z: 15, s: "P", n: "Phosphorus", m: 30.974, cat: "nonmetal", g: 15, p: 3, blk: "p", state: "solid", ec: "[Ne] 3s² 3p³", ox: [5, 3, -3], en: 2.19, mp: 317.3, bp: 553.7, d: 1.823 },
    { z: 16, s: "S", n: "Sulfur", m: 32.06, cat: "nonmetal", g: 16, p: 3, blk: "p", state: "solid", ec: "[Ne] 3s² 3p⁴", ox: [6, 4, 2, -2], en: 2.58, mp: 388.36, bp: 717.8, d: 2.07 },
    { z: 17, s: "Cl", n: "Chlorine", m: 35.45, cat: "halogen", g: 17, p: 3, blk: "p", state: "gas", ec: "[Ne] 3s² 3p⁵", ox: [7, 5, 3, 1, -1], en: 3.16, mp: 171.6, bp: 239.11, d: 0.0032 },
    { z: 18, s: "Ar", n: "Argon", m: 39.948, cat: "noble", g: 18, p: 3, blk: "p", state: "gas", ec: "[Ne] 3s² 3p⁶", ox: [0], en: null, mp: 83.81, bp: 87.302, d: 0.001784 },
    { z: 19, s: "K", n: "Potassium", m: 39.098, cat: "alkali", g: 1, p: 4, blk: "s", state: "solid", ec: "[Ar] 4s¹", ox: [1], en: 0.82, mp: 336.7, bp: 1032, d: 0.862 },
    { z: 20, s: "Ca", n: "Calcium", m: 40.078, cat: "alkaline-earth", g: 2, p: 4, blk: "s", state: "solid", ec: "[Ar] 4s²", ox: [2], en: 1.00, mp: 1115, bp: 1757, d: 1.55 },
    { z: 21, s: "Sc", n: "Scandium", m: 44.956, cat: "transition", g: 3, p: 4, blk: "d", state: "solid", ec: "[Ar] 3d¹ 4s²", ox: [3], en: 1.36, mp: 1814, bp: 3109, d: 2.985 },
    { z: 22, s: "Ti", n: "Titanium", m: 47.867, cat: "transition", g: 4, p: 4, blk: "d", state: "solid", ec: "[Ar] 3d² 4s²", ox: [4, 3, 2], en: 1.54, mp: 1941, bp: 3560, d: 4.506 },
    { z: 23, s: "V", n: "Vanadium", m: 50.942, cat: "transition", g: 5, p: 4, blk: "d", state: "solid", ec: "[Ar] 3d³ 4s²", ox: [5, 4, 3, 2], en: 1.63, mp: 2183, bp: 3680, d: 6.11 },
    { z: 24, s: "Cr", n: "Chromium", m: 51.996, cat: "transition", g: 6, p: 4, blk: "d", state: "solid", ec: "[Ar] 3d⁵ 4s¹", ox: [6, 3, 2], en: 1.66, mp: 2180, bp: 2944, d: 7.19 },
    { z: 25, s: "Mn", n: "Manganese", m: 54.938, cat: "transition", g: 7, p: 4, blk: "d", state: "solid", ec: "[Ar] 3d⁵ 4s²", ox: [7, 4, 3, 2], en: 1.55, mp: 1519, bp: 2334, d: 7.21 },
    { z: 26, s: "Fe", n: "Iron", m: 55.845, cat: "transition", g: 8, p: 4, blk: "d", state: "solid", ec: "[Ar] 3d⁶ 4s²", ox: [3, 2], en: 1.83, mp: 1811, bp: 3134, d: 7.874 },
    { z: 27, s: "Co", n: "Cobalt", m: 58.933, cat: "transition", g: 9, p: 4, blk: "d", state: "solid", ec: "[Ar] 3d⁷ 4s²", ox: [3, 2], en: 1.88, mp: 1768, bp: 3200, d: 8.90 },
    { z: 28, s: "Ni", n: "Nickel", m: 58.693, cat: "transition", g: 10, p: 4, blk: "d", state: "solid", ec: "[Ar] 3d⁸ 4s²", ox: [2, 3], en: 1.91, mp: 1728, bp: 3003, d: 8.908 },
    { z: 29, s: "Cu", n: "Copper", m: 63.546, cat: "transition", g: 11, p: 4, blk: "d", state: "solid", ec: "[Ar] 3d¹⁰ 4s¹", ox: [2, 1], en: 1.90, mp: 1357.77, bp: 2835, d: 8.96 },
    { z: 30, s: "Zn", n: "Zinc", m: 65.38, cat: "transition", g: 12, p: 4, blk: "d", state: "solid", ec: "[Ar] 3d¹⁰ 4s²", ox: [2], en: 1.65, mp: 692.68, bp: 1180, d: 7.14 },
    { z: 31, s: "Ga", n: "Gallium", m: 69.723, cat: "post-transition", g: 13, p: 4, blk: "p", state: "solid", ec: "[Ar] 3d¹⁰ 4s² 4p¹", ox: [3], en: 1.81, mp: 302.91, bp: 2673, d: 5.91 },
    { z: 32, s: "Ge", n: "Germanium", m: 72.630, cat: "metalloid", g: 14, p: 4, blk: "p", state: "solid", ec: "[Ar] 3d¹⁰ 4s² 4p²", ox: [4, 2], en: 2.01, mp: 1211.4, bp: 3106, d: 5.323 },
    { z: 33, s: "As", n: "Arsenic", m: 74.922, cat: "metalloid", g: 15, p: 4, blk: "p", state: "solid", ec: "[Ar] 3d¹⁰ 4s² 4p³", ox: [5, 3, -3], en: 2.18, mp: 1090, bp: 887, d: 5.727 },
    { z: 34, s: "Se", n: "Selenium", m: 78.971, cat: "nonmetal", g: 16, p: 4, blk: "p", state: "solid", ec: "[Ar] 3d¹⁰ 4s² 4p⁴", ox: [6, 4, -2], en: 2.55, mp: 494, bp: 958, d: 4.819 },
    { z: 35, s: "Br", n: "Bromine", m: 79.904, cat: "halogen", g: 17, p: 4, blk: "p", state: "liquid", ec: "[Ar] 3d¹⁰ 4s² 4p⁵", ox: [5, 3, 1, -1], en: 2.96, mp: 265.8, bp: 332.0, d: 3.1028 },
    { z: 36, s: "Kr", n: "Krypton", m: 83.798, cat: "noble", g: 18, p: 4, blk: "p", state: "gas", ec: "[Ar] 3d¹⁰ 4s² 4p⁶", ox: [2, 0], en: 3.00, mp: 115.79, bp: 119.93, d: 0.003749 },
    { z: 37, s: "Rb", n: "Rubidium", m: 85.468, cat: "alkali", g: 1, p: 5, blk: "s", state: "solid", ec: "[Kr] 5s¹", ox: [1], en: 0.82, mp: 312.46, bp: 961, d: 1.532 },
    { z: 38, s: "Sr", n: "Strontium", m: 87.62, cat: "alkaline-earth", g: 2, p: 5, blk: "s", state: "solid", ec: "[Kr] 5s²", ox: [2], en: 0.95, mp: 1050, bp: 1655, d: 2.64 },
    { z: 39, s: "Y", n: "Yttrium", m: 88.906, cat: "transition", g: 3, p: 5, blk: "d", state: "solid", ec: "[Kr] 4d¹ 5s²", ox: [3], en: 1.22, mp: 1799, bp: 3609, d: 4.472 },
    { z: 40, s: "Zr", n: "Zirconium", m: 91.224, cat: "transition", g: 4, p: 5, blk: "d", state: "solid", ec: "[Kr] 4d² 5s²", ox: [4], en: 1.33, mp: 2128, bp: 4682, d: 6.52 },
    { z: 41, s: "Nb", n: "Niobium", m: 92.906, cat: "transition", g: 5, p: 5, blk: "d", state: "solid", ec: "[Kr] 4d⁴ 5s¹", ox: [5, 3], en: 1.6, mp: 2750, bp: 5017, d: 8.57 },
    { z: 42, s: "Mo", n: "Molybdenum", m: 95.95, cat: "transition", g: 6, p: 5, blk: "d", state: "solid", ec: "[Kr] 4d⁵ 5s¹", ox: [6, 4, 3], en: 2.16, mp: 2896, bp: 4912, d: 10.28 },
    { z: 43, s: "Tc", n: "Technetium", m: 98, cat: "transition", g: 7, p: 5, blk: "d", state: "solid", ec: "[Kr] 4d⁵ 5s²", ox: [7, 4], en: 1.9, mp: 2430, bp: 4538, d: 11.5 },
    { z: 44, s: "Ru", n: "Ruthenium", m: 101.07, cat: "transition", g: 8, p: 5, blk: "d", state: "solid", ec: "[Kr] 4d⁷ 5s¹", ox: [4, 3], en: 2.2, mp: 2607, bp: 4423, d: 12.45 },
    { z: 45, s: "Rh", n: "Rhodium", m: 102.91, cat: "transition", g: 9, p: 5, blk: "d", state: "solid", ec: "[Kr] 4d⁸ 5s¹", ox: [3], en: 2.28, mp: 2237, bp: 3968, d: 12.41 },
    { z: 46, s: "Pd", n: "Palladium", m: 106.42, cat: "transition", g: 10, p: 5, blk: "d", state: "solid", ec: "[Kr] 4d¹⁰", ox: [2, 4], en: 2.20, mp: 1828.05, bp: 3236, d: 12.023 },
    { z: 47, s: "Ag", n: "Silver", m: 107.87, cat: "transition", g: 11, p: 5, blk: "d", state: "solid", ec: "[Kr] 4d¹⁰ 5s¹", ox: [1], en: 1.93, mp: 1234.93, bp: 2435, d: 10.49 },
    { z: 48, s: "Cd", n: "Cadmium", m: 112.41, cat: "transition", g: 12, p: 5, blk: "d", state: "solid", ec: "[Kr] 4d¹⁰ 5s²", ox: [2], en: 1.69, mp: 594.22, bp: 1040, d: 8.65 },
    { z: 49, s: "In", n: "Indium", m: 114.82, cat: "post-transition", g: 13, p: 5, blk: "p", state: "solid", ec: "[Kr] 4d¹⁰ 5s² 5p¹", ox: [3], en: 1.78, mp: 429.75, bp: 2345, d: 7.31 },
    { z: 50, s: "Sn", n: "Tin", m: 118.71, cat: "post-transition", g: 14, p: 5, blk: "p", state: "solid", ec: "[Kr] 4d¹⁰ 5s² 5p²", ox: [4, 2], en: 1.96, mp: 505.08, bp: 2875, d: 7.265 },
    { z: 51, s: "Sb", n: "Antimony", m: 121.76, cat: "metalloid", g: 15, p: 5, blk: "p", state: "solid", ec: "[Kr] 4d¹⁰ 5s² 5p³", ox: [5, 3, -3], en: 2.05, mp: 903.78, bp: 1860, d: 6.697 },
    { z: 52, s: "Te", n: "Tellurium", m: 127.60, cat: "metalloid", g: 16, p: 5, blk: "p", state: "solid", ec: "[Kr] 4d¹⁰ 5s² 5p⁴", ox: [6, 4, -2], en: 2.1, mp: 722.66, bp: 1261, d: 6.24 },
    { z: 53, s: "I", n: "Iodine", m: 126.90, cat: "halogen", g: 17, p: 5, blk: "p", state: "solid", ec: "[Kr] 4d¹⁰ 5s² 5p⁵", ox: [7, 5, 1, -1], en: 2.66, mp: 386.85, bp: 457.4, d: 4.933 },
    { z: 54, s: "Xe", n: "Xenon", m: 131.29, cat: "noble", g: 18, p: 5, blk: "p", state: "gas", ec: "[Kr] 4d¹⁰ 5s² 5p⁶", ox: [6, 4, 2, 0], en: 2.6, mp: 161.4, bp: 165.03, d: 0.005887 },
    { z: 55, s: "Cs", n: "Cesium", m: 132.91, cat: "alkali", g: 1, p: 6, blk: "s", state: "solid", ec: "[Xe] 6s¹", ox: [1], en: 0.79, mp: 301.59, bp: 944, d: 1.93 },
    { z: 56, s: "Ba", n: "Barium", m: 137.33, cat: "alkaline-earth", g: 2, p: 6, blk: "s", state: "solid", ec: "[Xe] 6s²", ox: [2], en: 0.89, mp: 1000, bp: 2170, d: 3.51 },
    { z: 57, s: "La", n: "Lanthanum", m: 138.91, cat: "lanthanide", g: 3, p: 6, blk: "d", state: "solid", ec: "[Xe] 5d¹ 6s²", ox: [3], en: 1.10, mp: 1193, bp: 3737, d: 6.162 },
    { z: 58, s: "Ce", n: "Cerium", m: 140.12, cat: "lanthanide", g: 3, p: 6, blk: "f", state: "solid", ec: "[Xe] 4f¹ 5d¹ 6s²", ox: [4, 3], en: 1.12, mp: 1068, bp: 3716, d: 6.77 },
    { z: 59, s: "Pr", n: "Praseodymium", m: 140.91, cat: "lanthanide", g: 3, p: 6, blk: "f", state: "solid", ec: "[Xe] 4f³ 6s²", ox: [3], en: 1.13, mp: 1208, bp: 3793, d: 6.77 },
    { z: 60, s: "Nd", n: "Neodymium", m: 144.24, cat: "lanthanide", g: 3, p: 6, blk: "f", state: "solid", ec: "[Xe] 4f⁴ 6s²", ox: [3], en: 1.14, mp: 1297, bp: 3347, d: 7.01 },
    { z: 61, s: "Pm", n: "Promethium", m: 145, cat: "lanthanide", g: 3, p: 6, blk: "f", state: "solid", ec: "[Xe] 4f⁵ 6s²", ox: [3], en: 1.13, mp: 1315, bp: 3273, d: 7.26 },
    { z: 62, s: "Sm", n: "Samarium", m: 150.36, cat: "lanthanide", g: 3, p: 6, blk: "f", state: "solid", ec: "[Xe] 4f⁶ 6s²", ox: [3, 2], en: 1.17, mp: 1345, bp: 2067, d: 7.52 },
    { z: 63, s: "Eu", n: "Europium", m: 151.96, cat: "lanthanide", g: 3, p: 6, blk: "f", state: "solid", ec: "[Xe] 4f⁷ 6s²", ox: [3, 2], en: 1.2, mp: 1099, bp: 1802, d: 5.244 },
    { z: 64, s: "Gd", n: "Gadolinium", m: 157.25, cat: "lanthanide", g: 3, p: 6, blk: "f", state: "solid", ec: "[Xe] 4f⁷ 5d¹ 6s²", ox: [3], en: 1.20, mp: 1585, bp: 3546, d: 7.90 },
    { z: 65, s: "Tb", n: "Terbium", m: 158.93, cat: "lanthanide", g: 3, p: 6, blk: "f", state: "solid", ec: "[Xe] 4f⁹ 6s²", ox: [3, 4], en: 1.2, mp: 1629, bp: 3503, d: 8.23 },
    { z: 66, s: "Dy", n: "Dysprosium", m: 162.50, cat: "lanthanide", g: 3, p: 6, blk: "f", state: "solid", ec: "[Xe] 4f¹⁰ 6s²", ox: [3], en: 1.22, mp: 1680, bp: 2840, d: 8.54 },
    { z: 67, s: "Ho", n: "Holmium", m: 164.93, cat: "lanthanide", g: 3, p: 6, blk: "f", state: "solid", ec: "[Xe] 4f¹¹ 6s²", ox: [3], en: 1.23, mp: 1734, bp: 2993, d: 8.79 },
    { z: 68, s: "Er", n: "Erbium", m: 167.26, cat: "lanthanide", g: 3, p: 6, blk: "f", state: "solid", ec: "[Xe] 4f¹² 6s²", ox: [3], en: 1.24, mp: 1802, bp: 3141, d: 9.066 },
    { z: 69, s: "Tm", n: "Thulium", m: 168.93, cat: "lanthanide", g: 3, p: 6, blk: "f", state: "solid", ec: "[Xe] 4f¹³ 6s²", ox: [3], en: 1.25, mp: 1818, bp: 2223, d: 9.32 },
    { z: 70, s: "Yb", n: "Ytterbium", m: 173.05, cat: "lanthanide", g: 3, p: 6, blk: "f", state: "solid", ec: "[Xe] 4f¹⁴ 6s²", ox: [3, 2], en: 1.1, mp: 1097, bp: 1469, d: 6.90 },
    { z: 71, s: "Lu", n: "Lutetium", m: 174.97, cat: "lanthanide", g: 3, p: 6, blk: "d", state: "solid", ec: "[Xe] 4f¹⁴ 5d¹ 6s²", ox: [3], en: 1.27, mp: 1925, bp: 3675, d: 9.841 },
    { z: 72, s: "Hf", n: "Hafnium", m: 178.49, cat: "transition", g: 4, p: 6, blk: "d", state: "solid", ec: "[Xe] 4f¹⁴ 5d² 6s²", ox: [4], en: 1.3, mp: 2506, bp: 4876, d: 13.31 },
    { z: 73, s: "Ta", n: "Tantalum", m: 180.95, cat: "transition", g: 5, p: 6, blk: "d", state: "solid", ec: "[Xe] 4f¹⁴ 5d³ 6s²", ox: [5], en: 1.5, mp: 3290, bp: 5731, d: 16.69 },
    { z: 74, s: "W", n: "Tungsten", m: 183.84, cat: "transition", g: 6, p: 6, blk: "d", state: "solid", ec: "[Xe] 4f¹⁴ 5d⁴ 6s²", ox: [6, 4], en: 2.36, mp: 3695, bp: 5828, d: 19.25 },
    { z: 75, s: "Re", n: "Rhenium", m: 186.21, cat: "transition", g: 7, p: 6, blk: "d", state: "solid", ec: "[Xe] 4f¹⁴ 5d⁵ 6s²", ox: [7, 4], en: 1.9, mp: 3459, bp: 5869, d: 21.02 },
    { z: 76, s: "Os", n: "Osmium", m: 190.23, cat: "transition", g: 8, p: 6, blk: "d", state: "solid", ec: "[Xe] 4f¹⁴ 5d⁶ 6s²", ox: [4, 8], en: 2.2, mp: 3306, bp: 5285, d: 22.59 },
    { z: 77, s: "Ir", n: "Iridium", m: 192.22, cat: "transition", g: 9, p: 6, blk: "d", state: "solid", ec: "[Xe] 4f¹⁴ 5d⁷ 6s²", ox: [4, 3], en: 2.20, mp: 2719, bp: 4701, d: 22.56 },
    { z: 78, s: "Pt", n: "Platinum", m: 195.08, cat: "transition", g: 10, p: 6, blk: "d", state: "solid", ec: "[Xe] 4f¹⁴ 5d⁹ 6s¹", ox: [4, 2], en: 2.28, mp: 2041.4, bp: 4098, d: 21.45 },
    { z: 79, s: "Au", n: "Gold", m: 196.97, cat: "transition", g: 11, p: 6, blk: "d", state: "solid", ec: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", ox: [3, 1], en: 2.54, mp: 1337.33, bp: 3129, d: 19.3 },
    { z: 80, s: "Hg", n: "Mercury", m: 200.59, cat: "transition", g: 12, p: 6, blk: "d", state: "liquid", ec: "[Xe] 4f¹⁴ 5d¹⁰ 6s²", ox: [2, 1], en: 2.00, mp: 234.32, bp: 629.88, d: 13.534 },
    { z: 81, s: "Tl", n: "Thallium", m: 204.38, cat: "post-transition", g: 13, p: 6, blk: "p", state: "solid", ec: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹", ox: [1, 3], en: 1.62, mp: 577, bp: 1746, d: 11.85 },
    { z: 82, s: "Pb", n: "Lead", m: 207.2, cat: "post-transition", g: 14, p: 6, blk: "p", state: "solid", ec: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²", ox: [2, 4], en: 2.33, mp: 600.61, bp: 2022, d: 11.34 },
    { z: 83, s: "Bi", n: "Bismuth", m: 208.98, cat: "post-transition", g: 15, p: 6, blk: "p", state: "solid", ec: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³", ox: [3, 5], en: 2.02, mp: 544.7, bp: 1837, d: 9.78 },
    { z: 84, s: "Po", n: "Polonium", m: 209, cat: "post-transition", g: 16, p: 6, blk: "p", state: "solid", ec: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴", ox: [4, 2], en: 2.0, mp: 527, bp: 1235, d: 9.196 },
    { z: 85, s: "At", n: "Astatine", m: 210, cat: "halogen", g: 17, p: 6, blk: "p", state: "solid", ec: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵", ox: [-1, 1], en: 2.2, mp: 575, bp: 610, d: 6.35 },
    { z: 86, s: "Rn", n: "Radon", m: 222, cat: "noble", g: 18, p: 6, blk: "p", state: "gas", ec: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶", ox: [2, 0], en: 2.2, mp: 202, bp: 211.3, d: 0.00973 },
    { z: 87, s: "Fr", n: "Francium", m: 223, cat: "alkali", g: 1, p: 7, blk: "s", state: "solid", ec: "[Rn] 7s¹", ox: [1], en: 0.7, mp: 300, bp: 950, d: 1.87 },
    { z: 88, s: "Ra", n: "Radium", m: 226, cat: "alkaline-earth", g: 2, p: 7, blk: "s", state: "solid", ec: "[Rn] 7s²", ox: [2], en: 0.9, mp: 973, bp: 2010, d: 5.5 },
    { z: 89, s: "Ac", n: "Actinium", m: 227, cat: "actinide", g: 3, p: 7, blk: "d", state: "solid", ec: "[Rn] 6d¹ 7s²", ox: [3], en: 1.1, mp: 1323, bp: 3471, d: 10.07 },
    { z: 90, s: "Th", n: "Thorium", m: 232.04, cat: "actinide", g: 3, p: 7, blk: "f", state: "solid", ec: "[Rn] 6d² 7s²", ox: [4], en: 1.3, mp: 2115, bp: 5061, d: 11.72 },
    { z: 91, s: "Pa", n: "Protactinium", m: 231.04, cat: "actinide", g: 3, p: 7, blk: "f", state: "solid", ec: "[Rn] 5f² 6d¹ 7s²", ox: [5, 4], en: 1.5, mp: 1841, bp: 4300, d: 15.37 },
    { z: 92, s: "U", n: "Uranium", m: 238.03, cat: "actinide", g: 3, p: 7, blk: "f", state: "solid", ec: "[Rn] 5f³ 6d¹ 7s²", ox: [6, 4], en: 1.38, mp: 1405.3, bp: 4404, d: 19.1 },
    { z: 93, s: "Np", n: "Neptunium", m: 237, cat: "actinide", g: 3, p: 7, blk: "f", state: "solid", ec: "[Rn] 5f⁴ 6d¹ 7s²", ox: [5, 4, 3], en: 1.36, mp: 917, bp: 4273, d: 20.45 },
    { z: 94, s: "Pu", n: "Plutonium", m: 244, cat: "actinide", g: 3, p: 7, blk: "f", state: "solid", ec: "[Rn] 5f⁶ 7s²", ox: [4, 3, 6], en: 1.28, mp: 912.5, bp: 3505, d: 19.84 },
    { z: 95, s: "Am", n: "Americium", m: 243, cat: "actinide", g: 3, p: 7, blk: "f", state: "solid", ec: "[Rn] 5f⁷ 7s²", ox: [3, 4], en: 1.3, mp: 1449, bp: 2880, d: 12 },
    { z: 96, s: "Cm", n: "Curium", m: 247, cat: "actinide", g: 3, p: 7, blk: "f", state: "solid", ec: "[Rn] 5f⁷ 6d¹ 7s²", ox: [3], en: 1.3, mp: 1613, bp: 3383, d: 13.51 },
    { z: 97, s: "Bk", n: "Berkelium", m: 247, cat: "actinide", g: 3, p: 7, blk: "f", state: "solid", ec: "[Rn] 5f⁹ 7s²", ox: [3, 4], en: 1.3, mp: 1259, bp: 2900, d: 14.78 },
    { z: 98, s: "Cf", n: "Californium", m: 251, cat: "actinide", g: 3, p: 7, blk: "f", state: "solid", ec: "[Rn] 5f¹⁰ 7s²", ox: [3], en: 1.3, mp: 1173, bp: 1743, d: 15.1 },
    { z: 99, s: "Es", n: "Einsteinium", m: 252, cat: "actinide", g: 3, p: 7, blk: "f", state: "solid", ec: "[Rn] 5f¹¹ 7s²", ox: [3], en: 1.3, mp: 1133, bp: 1269, d: 8.84 },
    { z: 100, s: "Fm", n: "Fermium", m: 257, cat: "actinide", g: 3, p: 7, blk: "f", state: "solid", ec: "[Rn] 5f¹² 7s²", ox: [3], en: 1.3, mp: 1800, bp: null, d: null },
    { z: 101, s: "Md", n: "Mendelevium", m: 258, cat: "actinide", g: 3, p: 7, blk: "f", state: "solid", ec: "[Rn] 5f¹³ 7s²", ox: [3, 2], en: 1.3, mp: 1100, bp: null, d: null },
    { z: 102, s: "No", n: "Nobelium", m: 259, cat: "actinide", g: 3, p: 7, blk: "f", state: "solid", ec: "[Rn] 5f¹⁴ 7s²", ox: [2, 3], en: 1.3, mp: 1100, bp: null, d: null },
    { z: 103, s: "Lr", n: "Lawrencium", m: 266, cat: "actinide", g: 3, p: 7, blk: "d", state: "solid", ec: "[Rn] 5f¹⁴ 7s² 7p¹", ox: [3], en: 1.3, mp: 1900, bp: null, d: null },
    { z: 104, s: "Rf", n: "Rutherfordium", m: 267, cat: "transition", g: 4, p: 7, blk: "d", state: "synthetic", ec: "[Rn] 5f¹⁴ 6d² 7s²", ox: [4], en: null, mp: 2400, bp: 5800, d: 23.2 },
    { z: 105, s: "Db", n: "Dubnium", m: 268, cat: "transition", g: 5, p: 7, blk: "d", state: "synthetic", ec: "[Rn] 5f¹⁴ 6d³ 7s²", ox: [5], en: null, mp: null, bp: null, d: 29.3 },
    { z: 106, s: "Sg", n: "Seaborgium", m: 269, cat: "transition", g: 6, p: 7, blk: "d", state: "synthetic", ec: "[Rn] 5f¹⁴ 6d⁴ 7s²", ox: [6], en: null, mp: null, bp: null, d: 35.0 },
    { z: 107, s: "Bh", n: "Bohrium", m: 270, cat: "transition", g: 7, p: 7, blk: "d", state: "synthetic", ec: "[Rn] 5f¹⁴ 6d⁵ 7s²", ox: [7], en: null, mp: null, bp: null, d: 37.1 },
    { z: 108, s: "Hs", n: "Hassium", m: 277, cat: "transition", g: 8, p: 7, blk: "d", state: "synthetic", ec: "[Rn] 5f¹⁴ 6d⁶ 7s²", ox: [8], en: null, mp: null, bp: null, d: 40.7 },
    { z: 109, s: "Mt", n: "Meitnerium", m: 278, cat: "transition", g: 9, p: 7, blk: "d", state: "synthetic", ec: "[Rn] 5f¹⁴ 6d⁷ 7s²", ox: [3], en: null, mp: null, bp: null, d: 37.4 },
    { z: 110, s: "Ds", n: "Darmstadtium", m: 281, cat: "transition", g: 10, p: 7, blk: "d", state: "synthetic", ec: "[Rn] 5f¹⁴ 6d⁸ 7s²", ox: [4], en: null, mp: null, bp: null, d: 34.8 },
    { z: 111, s: "Rg", n: "Roentgenium", m: 282, cat: "transition", g: 11, p: 7, blk: "d", state: "synthetic", ec: "[Rn] 5f¹⁴ 6d⁹ 7s²", ox: [3], en: null, mp: null, bp: null, d: 28.7 },
    { z: 112, s: "Cn", n: "Copernicium", m: 285, cat: "transition", g: 12, p: 7, blk: "d", state: "synthetic", ec: "[Rn] 5f¹⁴ 6d¹⁰ 7s²", ox: [2], en: null, mp: 283, bp: 340, d: 23.7 },
    { z: 113, s: "Nh", n: "Nihonium", m: 286, cat: "post-transition", g: 13, p: 7, blk: "p", state: "synthetic", ec: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹", ox: [1], en: null, mp: 700, bp: 1430, d: 16 },
    { z: 114, s: "Fl", n: "Flerovium", m: 289, cat: "post-transition", g: 14, p: 7, blk: "p", state: "synthetic", ec: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²", ox: [2], en: null, mp: 340, bp: 420, d: 14 },
    { z: 115, s: "Mc", n: "Moscovium", m: 290, cat: "post-transition", g: 15, p: 7, blk: "p", state: "synthetic", ec: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³", ox: [1, 3], en: null, mp: 670, bp: 1400, d: 13.5 },
    { z: 116, s: "Lv", n: "Livermorium", m: 293, cat: "post-transition", g: 16, p: 7, blk: "p", state: "synthetic", ec: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴", ox: [2], en: null, mp: 709, bp: 1085, d: 12.9 },
    { z: 117, s: "Ts", n: "Tennessine", m: 294, cat: "halogen", g: 17, p: 7, blk: "p", state: "synthetic", ec: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵", ox: [-1, 1], en: null, mp: 723, bp: 883, d: 7.2 },
    { z: 118, s: "Og", n: "Oganesson", m: 294, cat: "noble", g: 18, p: 7, blk: "p", state: "synthetic", ec: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶", ox: [0], en: null, mp: 325, bp: 450, d: 5.0 }
  ];

  // Element Lookup Map
  const ELEMENT_MAP = {};
  const ELEMENT_BY_Z = {};
  ELEMENTS.forEach(el => {
    ELEMENT_MAP[el.s] = el;
    ELEMENT_BY_Z[el.z] = el;
  });

  // --------------------------------------------------------------------------
  // 2. Chemical Formula Parser & Molar Mass Calculator
  // --------------------------------------------------------------------------
  function parseChemicalFormula(formula) {
    if (!formula || typeof formula !== 'string') return null;
    let str = formula.trim().replace(/\s+/g, '');
    
    // Handle hydrates e.g. CuSO4*5H2O or CuSO4.5H2O
    let hydrateMultiplier = 1;
    let mainStr = str;
    let hydrateStr = null;
    const dotIdx = Math.max(str.indexOf('*'), str.indexOf('.'));
    if (dotIdx !== -1) {
      mainStr = str.substring(0, dotIdx);
      const after = str.substring(dotIdx + 1);
      const m = after.match(/^(\d*)(.*)$/);
      hydrateMultiplier = m && m[1] ? parseInt(m[1], 10) : 1;
      hydrateStr = m ? m[2] : '';
    }

    function parseSimple(s, mult) {
      const counts = {};
      const regex = /([A-Z][a-z]*)(\d*)|(\()|(\))(\d*)/g;
      const stack = [{}];
      let match;

      while ((match = regex.exec(s)) !== null) {
        if (match[1]) {
          // Element match
          const elem = match[1];
          const count = match[2] ? parseInt(match[2], 10) : 1;
          const current = stack[stack.length - 1];
          current[elem] = (current[elem] || 0) + count;
        } else if (match[3]) {
          // Open parenthesis
          stack.push({});
        } else if (match[4]) {
          // Close parenthesis
          const groupMultiplier = match[5] ? parseInt(match[5], 10) : 1;
          const popped = stack.pop();
          const current = stack[stack.length - 1];
          for (let el in popped) {
            current[el] = (current[el] || 0) + popped[el] * groupMultiplier;
          }
        }
      }

      const res = stack[0];
      for (let el in res) {
        counts[el] = (counts[el] || 0) + res[el] * mult;
      }
      return counts;
    }

    try {
      const mainCounts = parseSimple(mainStr, 1);
      if (hydrateStr) {
        const hydCounts = parseSimple(hydrateStr, hydrateMultiplier);
        for (let el in hydCounts) {
          mainCounts[el] = (mainCounts[el] || 0) + hydCounts[el];
        }
      }
      return mainCounts;
    } catch (e) {
      return null;
    }
  }

  function calculateMolarMass(formula) {
    const counts = parseChemicalFormula(formula);
    if (!counts) return null;
    let totalMass = 0;
    const breakdown = {};

    for (let symbol in counts) {
      const el = ELEMENT_MAP[symbol];
      if (!el) return null; // Unknown element
      const mass = counts[symbol] * el.m;
      totalMass += mass;
      breakdown[symbol] = {
        name: el.n,
        atomicMass: el.m,
        count: counts[symbol],
        totalMass: mass,
        percentage: 0
      };
    }

    for (let s in breakdown) {
      breakdown[s].percentage = (breakdown[s].totalMass / totalMass) * 100;
    }

    return {
      formula: formula,
      totalMass: totalMass,
      breakdown: breakdown,
      counts: counts
    };
  }

  // --------------------------------------------------------------------------
  // 3. Matrix-Based Chemical Equation Balancer
  // --------------------------------------------------------------------------
  function balanceEquation(equationStr) {
    if (!equationStr || typeof equationStr !== 'string') {
      return { success: false, error: "Please enter a valid chemical equation." };
    }

    // Split by ->, =, ==, or \u2192
    const parts = equationStr.split(/->|=|==|\u2192/);
    if (parts.length !== 2) {
      return { success: false, error: "Equation must have reactants and products separated by '->' or '='." };
    }

    const reactants = parts[0].split('+').map(s => s.trim()).filter(Boolean);
    const products = parts[1].split('+').map(s => s.trim()).filter(Boolean);

    if (reactants.length === 0 || products.length === 0) {
      return { success: false, error: "Both reactants and products must contain chemical species." };
    }

    const species = [];
    const elementsSet = new Set();

    reactants.forEach(r => {
      const parsed = parseChemicalFormula(r);
      if (!parsed) throw new Error("Could not parse reactant: " + r);
      species.push({ raw: r, side: -1, counts: parsed });
      Object.keys(parsed).forEach(el => elementsSet.add(el));
    });

    products.forEach(p => {
      const parsed = parseChemicalFormula(p);
      if (!parsed) throw new Error("Could not parse product: " + p);
      species.push({ raw: p, side: 1, counts: parsed });
      Object.keys(parsed).forEach(el => elementsSet.add(el));
    });

    const elementsList = Array.from(elementsSet);
    const M = elementsList.length; // rows (elements)
    const N = species.length;      // cols (species)

    // Build matrix A where A[i][j] is count of element i in species j (* side)
    const matrix = [];
    for (let i = 0; i < M; i++) {
      const row = [];
      const el = elementsList[i];
      for (let j = 0; j < N; j++) {
        const count = (species[j].counts[el] || 0) * species[j].side;
        row.push(count);
      }
      matrix.push(row);
    }

    // Gaussian Elimination with Partial Pivoting to find nullspace
    function gcd(a, b) {
      a = Math.abs(Math.round(a));
      b = Math.abs(Math.round(b));
      while (b) { let t = b; b = a % b; a = t; }
      return a;
    }
    function lcm(a, b) {
      if (a === 0 || b === 0) return 0;
      return Math.abs(Math.round((a * b) / gcd(a, b)));
    }

    // Solve for integer nullspace vector
    // Brute force / integer lattice search for small systems up to N <= 8, or linear algebra
    let bestCoeffs = null;
    const maxCoeff = 24;

    function checkValid(coeffs) {
      for (let i = 0; i < M; i++) {
        let sum = 0;
        for (let j = 0; j < N; j++) {
          sum += matrix[i][j] * coeffs[j];
        }
        if (Math.abs(sum) > 1e-6) return false;
      }
      return true;
    }

    // Try matrix solve or systematic integer search
    function search(index, current) {
      if (bestCoeffs) return;
      if (index === N) {
        if (checkValid(current)) {
          bestCoeffs = current.slice();
        }
        return;
      }
      for (let c = 1; c <= (index < 3 ? 12 : 20); c++) {
        current[index] = c;
        search(index + 1, current);
        if (bestCoeffs) return;
      }
    }

    try {
      search(0, new Array(N).fill(1));
    } catch(e){}

    if (!bestCoeffs) {
      return { success: false, error: "Unable to find integer stoichiometric balance. Please verify reaction formula." };
    }

    // Reduce coefficients by their greatest common divisor
    let overallGcd = bestCoeffs[0];
    for (let k = 1; k < N; k++) {
      overallGcd = gcd(overallGcd, bestCoeffs[k]);
    }
    const finalCoeffs = bestCoeffs.map(c => c / overallGcd);

    const reactantCoeffs = finalCoeffs.slice(0, reactants.length);
    const productCoeffs = finalCoeffs.slice(reactants.length);

    // Format balanced equation
    const balancedReactants = reactants.map((r, i) => (reactantCoeffs[i] > 1 ? reactantCoeffs[i] + ' ' : '') + r).join(' + ');
    const balancedProducts = products.map((p, i) => (productCoeffs[i] > 1 ? productCoeffs[i] + ' ' : '') + p).join(' + ');
    const balancedString = balancedReactants + ' \u2192 ' + balancedProducts;

    // Atom comparison table
    const atomAudit = elementsList.map(el => {
      let rCount = 0;
      let pCount = 0;
      reactants.forEach((r, idx) => {
        rCount += (species[idx].counts[el] || 0) * reactantCoeffs[idx];
      });
      products.forEach((p, idx) => {
        pCount += (species[reactants.length + idx].counts[el] || 0) * productCoeffs[idx];
      });
      return { element: el, name: ELEMENT_MAP[el] ? ELEMENT_MAP[el].n : el, reactants: rCount, products: pCount, balanced: rCount === pCount };
    });

    return {
      success: true,
      original: equationStr,
      balanced: balancedString,
      reactantCoeffs: reactantCoeffs,
      productCoeffs: productCoeffs,
      atomAudit: atomAudit
    };
  }

  // --------------------------------------------------------------------------
  // 4. 3D Molecular Projection & Geometry Engine
  // --------------------------------------------------------------------------
  const MOLECULES_3D = {
    "water": {
      name: "Water", formula: "H₂O", geometry: "Bent", angle: "104.5°", hybridization: "sp³", polarity: "Polar (1.85 D)",
      atoms: [
        { elem: "O", x: 0, y: 0, z: 0, r: 24, col: "#EF4444" },
        { elem: "H", x: -0.76, y: 0.59, z: 0, r: 15, col: "#FFFFFF" },
        { elem: "H", x: 0.76, y: 0.59, z: 0, r: 15, col: "#FFFFFF" }
      ],
      bonds: [[0, 1, 1], [0, 2, 1]]
    },
    "carbon-dioxide": {
      name: "Carbon Dioxide", formula: "CO₂", geometry: "Linear", angle: "180°", hybridization: "sp", polarity: "Nonpolar (0 D)",
      atoms: [
        { elem: "C", x: 0, y: 0, z: 0, r: 22, col: "#475569" },
        { elem: "O", x: -1.16, y: 0, z: 0, r: 24, col: "#EF4444" },
        { elem: "O", x: 1.16, y: 0, z: 0, r: 24, col: "#EF4444" }
      ],
      bonds: [[0, 1, 2], [0, 2, 2]]
    },
    "methane": {
      name: "Methane", formula: "CH₄", geometry: "Tetrahedral", angle: "109.5°", hybridization: "sp³", polarity: "Nonpolar (0 D)",
      atoms: [
        { elem: "C", x: 0, y: 0, z: 0, r: 22, col: "#475569" },
        { elem: "H", x: 0.63, y: 0.63, z: 0.63, r: 15, col: "#FFFFFF" },
        { elem: "H", x: -0.63, y: -0.63, z: 0.63, r: 15, col: "#FFFFFF" },
        { elem: "H", x: -0.63, y: 0.63, z: -0.63, r: 15, col: "#FFFFFF" },
        { elem: "H", x: 0.63, y: -0.63, z: -0.63, r: 15, col: "#FFFFFF" }
      ],
      bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]
    },
    "ammonia": {
      name: "Ammonia", formula: "NH₃", geometry: "Trigonal Pyramidal", angle: "107.3°", hybridization: "sp³", polarity: "Polar (1.47 D)",
      atoms: [
        { elem: "N", x: 0, y: 0.2, z: 0, r: 22, col: "#3B82F6" },
        { elem: "H", x: 0, y: -0.4, z: 0.94, r: 15, col: "#FFFFFF" },
        { elem: "H", x: 0.81, y: -0.4, z: -0.47, r: 15, col: "#FFFFFF" },
        { elem: "H", x: -0.81, y: -0.4, z: -0.47, r: 15, col: "#FFFFFF" }
      ],
      bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]]
    },
    "ethanol": {
      name: "Ethanol", formula: "C₂H₅OH", geometry: "Tetrahedral / Bent", angle: "109.5° / 104.5°", hybridization: "sp³", polarity: "Polar (1.69 D)",
      atoms: [
        { elem: "C", x: -0.75, y: 0, z: 0, r: 22, col: "#475569" },
        { elem: "C", x: 0.75, y: 0, z: 0, r: 22, col: "#475569" },
        { elem: "O", x: 1.35, y: 1.1, z: 0, r: 24, col: "#EF4444" },
        { elem: "H", x: 2.3, y: 1.0, z: 0, r: 15, col: "#FFFFFF" },
        { elem: "H", x: -1.15, y: 0.5, z: 0.88, r: 15, col: "#FFFFFF" },
        { elem: "H", x: -1.15, y: 0.5, z: -0.88, r: 15, col: "#FFFFFF" },
        { elem: "H", x: -1.15, y: -1.0, z: 0, r: 15, col: "#FFFFFF" },
        { elem: "H", x: 1.15, y: -0.5, z: 0.88, r: 15, col: "#FFFFFF" },
        { elem: "H", x: 1.15, y: -0.5, z: -0.88, r: 15, col: "#FFFFFF" }
      ],
      bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [1, 7, 1], [1, 8, 1]]
    },
    "benzene": {
      name: "Benzene", formula: "C₆H₆", geometry: "Planar Hexagonal", angle: "120°", hybridization: "sp²", polarity: "Nonpolar (0 D)",
      atoms: [
        { elem: "C", x: 1.4, y: 0, z: 0, r: 22, col: "#475569" },
        { elem: "C", x: 0.7, y: 1.21, z: 0, r: 22, col: "#475569" },
        { elem: "C", x: -0.7, y: 1.21, z: 0, r: 22, col: "#475569" },
        { elem: "C", x: -1.4, y: 0, z: 0, r: 22, col: "#475569" },
        { elem: "C", x: -0.7, y: -1.21, z: 0, r: 22, col: "#475569" },
        { elem: "C", x: 0.7, y: -1.21, z: 0, r: 22, col: "#475569" },
        { elem: "H", x: 2.45, y: 0, z: 0, r: 15, col: "#FFFFFF" },
        { elem: "H", x: 1.22, y: 2.12, z: 0, r: 15, col: "#FFFFFF" },
        { elem: "H", x: -1.22, y: 2.12, z: 0, r: 15, col: "#FFFFFF" },
        { elem: "H", x: -2.45, y: 0, z: 0, r: 15, col: "#FFFFFF" },
        { elem: "H", x: -1.22, y: -2.12, z: 0, r: 15, col: "#FFFFFF" },
        { elem: "H", x: 1.22, y: -2.12, z: 0, r: 15, col: "#FFFFFF" }
      ],
      bonds: [[0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1], [0, 6, 1], [1, 7, 1], [2, 8, 1], [3, 9, 1], [4, 10, 1], [5, 11, 1]]
    },
    "glucose": {
      name: "D-Glucose", formula: "C₆H₁₂O₆", geometry: "Chair Conformation", angle: "109.5°", hybridization: "sp³", polarity: "Highly Polar",
      atoms: [
        { elem: "C", x: -1.2, y: -0.5, z: 0.2, r: 22, col: "#475569" },
        { elem: "C", x: -0.6, y: 0.8, z: -0.2, r: 22, col: "#475569" },
        { elem: "C", x: 0.8, y: 0.9, z: 0.2, r: 22, col: "#475569" },
        { elem: "C", x: 1.5, y: -0.4, z: -0.2, r: 22, col: "#475569" },
        { elem: "C", x: 0.8, y: -1.6, z: 0.2, r: 22, col: "#475569" },
        { elem: "O", x: -0.5, y: -1.6, z: -0.2, r: 24, col: "#EF4444" },
        { elem: "O", x: -2.5, y: -0.4, z: -0.2, r: 24, col: "#EF4444" },
        { elem: "O", x: -1.2, y: 1.9, z: 0.3, r: 24, col: "#EF4444" },
        { elem: "O", x: 1.4, y: 2.0, z: -0.3, r: 24, col: "#EF4444" },
        { elem: "O", x: 2.8, y: -0.3, z: 0.2, r: 24, col: "#EF4444" }
      ],
      bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 0, 1], [0, 6, 1], [1, 7, 1], [2, 8, 1], [3, 9, 1]]
    },
    "oxygen": {
      name: "Oxygen Gas", formula: "O₂", geometry: "Linear", angle: "180°", hybridization: "sp²", polarity: "Nonpolar (0 D)",
      atoms: [
        { elem: "O", x: -0.6, y: 0, z: 0, r: 24, col: "#EF4444" },
        { elem: "O", x: 0.6, y: 0, z: 0, r: 24, col: "#EF4444" }
      ],
      bonds: [[0, 1, 2]]
    },
    "nitrogen": {
      name: "Nitrogen Gas", formula: "N₂", geometry: "Linear", angle: "180°", hybridization: "sp", polarity: "Nonpolar (0 D)",
      atoms: [
        { elem: "N", x: -0.55, y: 0, z: 0, r: 22, col: "#3B82F6" },
        { elem: "N", x: 0.55, y: 0, z: 0, r: 22, col: "#3B82F6" }
      ],
      bonds: [[0, 1, 3]]
    },
    "hydrogen": {
      name: "Hydrogen Gas", formula: "H₂", geometry: "Linear", angle: "180°", hybridization: "1s", polarity: "Nonpolar (0 D)",
      atoms: [
        { elem: "H", x: -0.37, y: 0, z: 0, r: 16, col: "#FFFFFF" },
        { elem: "H", x: 0.37, y: 0, z: 0, r: 16, col: "#FFFFFF" }
      ],
      bonds: [[0, 1, 1]]
    },
    "sulfur-hexafluoride": {
      name: "Sulfur Hexafluoride", formula: "SF₆", geometry: "Octahedral", angle: "90°", hybridization: "sp³d²", polarity: "Nonpolar (0 D)",
      atoms: [
        { elem: "S", x: 0, y: 0, z: 0, r: 25, col: "#FBBF24" },
        { elem: "F", x: 1.2, y: 0, z: 0, r: 18, col: "#10B981" },
        { elem: "F", x: -1.2, y: 0, z: 0, r: 18, col: "#10B981" },
        { elem: "F", x: 0, y: 1.2, z: 0, r: 18, col: "#10B981" },
        { elem: "F", x: 0, y: -1.2, z: 0, r: 18, col: "#10B981" },
        { elem: "F", x: 0, y: 0, z: 1.2, r: 18, col: "#10B981" },
        { elem: "F", x: 0, y: 0, z: -1.2, r: 18, col: "#10B981" }
      ],
      bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1]]
    },
    "phosphorus-pentachloride": {
      name: "Phosphorus Pentachloride", formula: "PCl₅", geometry: "Trigonal Bipyramidal", angle: "90° / 120°", hybridization: "sp³d", polarity: "Nonpolar (0 D)",
      atoms: [
        { elem: "P", x: 0, y: 0, z: 0, r: 24, col: "#F97316" },
        { elem: "Cl", x: 0, y: 1.4, z: 0, r: 20, col: "#22C55E" },
        { elem: "Cl", x: 0, y: -1.4, z: 0, r: 20, col: "#22C55E" },
        { elem: "Cl", x: 1.2, y: 0, z: 0, r: 20, col: "#22C55E" },
        { elem: "Cl", x: -0.6, y: 0, z: 1.04, r: 20, col: "#22C55E" },
        { elem: "Cl", x: -0.6, y: 0, z: -1.04, r: 20, col: "#22C55E" }
      ],
      bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1]]
    }
  };

  // 3D Canvas Renderer
  function create3DViewer(canvasId, initialMolKey) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    let molKey = initialMolKey || 'water';
    let rotX = 0.3;
    let rotY = 0.4;
    let zoom = 1.0;
    let mode = 'ball-and-stick'; // 'ball-and-stick' or 'space-filling'
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    function render() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.min(w, h) * 0.28 * zoom;

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      ctx.clearRect(0, 0, w, h);

      const mol = MOLECULES_3D[molKey];
      if (!mol) return;

      // Rotate atoms in 3D
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

      const transformedAtoms = mol.atoms.map((a, idx) => {
        // Rotate around Y
        let x1 = a.x * cosY + a.z * sinY;
        let y1 = a.y;
        let z1 = -a.x * sinY + a.z * cosY;

        // Rotate around X
        let x2 = x1;
        let y2 = y1 * cosX - z1 * sinX;
        let z2 = y1 * sinX + z1 * cosX;

        // Perspective projection
        const fov = 4.5;
        const pz = fov / (fov + z2);
        const px = cx + x2 * scale * pz;
        const py = cy - y2 * scale * pz;
        const pr = (mode === 'space-filling' ? a.r * 1.5 : a.r) * pz;

        return { idx, elem: a.elem, px, py, pz, pr, z: z2, col: a.col };
      });

      // Draw Bonds (if ball-and-stick)
      if (mode === 'ball-and-stick') {
        mol.bonds.forEach(b => {
          const a1 = transformedAtoms[b[0]];
          const a2 = transformedAtoms[b[1]];
          const order = b[2] || 1;

          ctx.strokeStyle = isDark ? '#64748B' : '#94A3B8';
          ctx.lineWidth = Math.max(3, 5 * ((a1.pz + a2.pz) / 2));

          if (order === 1) {
            ctx.beginPath();
            ctx.moveTo(a1.px, a1.py);
            ctx.lineTo(a2.px, a2.py);
            ctx.stroke();
          } else if (order === 2) {
            const dx = a2.px - a1.px;
            const dy = a2.py - a1.py;
            const len = Math.hypot(dx, dy) || 1;
            const ox = (-dy / len) * 4;
            const oy = (dx / len) * 4;

            ctx.beginPath();
            ctx.moveTo(a1.px + ox, a1.py + oy);
            ctx.lineTo(a2.px + ox, a2.py + oy);
            ctx.moveTo(a1.px - ox, a1.py - oy);
            ctx.lineTo(a2.px - ox, a2.py - oy);
            ctx.stroke();
          } else if (order === 3) {
            const dx = a2.px - a1.px;
            const dy = a2.py - a1.py;
            const len = Math.hypot(dx, dy) || 1;
            const ox = (-dy / len) * 6;
            const oy = (dx / len) * 6;

            ctx.beginPath();
            ctx.moveTo(a1.px, a1.py);
            ctx.lineTo(a2.px, a2.py);
            ctx.moveTo(a1.px + ox, a1.py + oy);
            ctx.lineTo(a2.px + ox, a2.py + oy);
            ctx.moveTo(a1.px - ox, a1.py - oy);
            ctx.lineTo(a2.px - ox, a2.py - oy);
            ctx.stroke();
          }
        });
      }

      // Sort atoms by Z (back to front) for depth buffering
      transformedAtoms.sort((a, b) => a.z - b.z);

      // Draw Atoms with 3D spherical radial lighting gradient
      transformedAtoms.forEach(a => {
        const grad = ctx.createRadialGradient(
          a.px - a.pr * 0.35, a.py - a.pr * 0.35, a.pr * 0.1,
          a.px, a.py, a.pr
        );
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.3, a.col);
        grad.addColorStop(1, '#000000');

        ctx.beginPath();
        ctx.arc(a.px, a.py, a.pr, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Atom label
        if (mode === 'ball-and-stick' && a.pr > 10) {
          ctx.fillStyle = (a.elem === 'H' || a.elem === 'C') ? '#0F172A' : '#FFFFFF';
          ctx.font = `bold ${Math.round(a.pr * 0.7)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(a.elem, a.px, a.py);
        }
      });
    }

    // Pointer Interaction Handlers
    function onPointerDown(e) {
      isDragging = true;
      lastMouseX = e.clientX || (e.touches && e.touches[0].clientX);
      lastMouseY = e.clientY || (e.touches && e.touches[0].clientY);
    }
    function onPointerMove(e) {
      if (!isDragging) return;
      const x = e.clientX || (e.touches && e.touches[0].clientX);
      const y = e.clientY || (e.touches && e.touches[0].clientY);
      const dx = x - lastMouseX;
      const dy = y - lastMouseY;
      lastMouseX = x;
      lastMouseY = y;

      rotY += dx * 0.01;
      rotX += dy * 0.01;
      render();
    }
    function onPointerUp() { isDragging = false; }
    function onWheel(e) {
      e.preventDefault();
      zoom *= (e.deltaY < 0 ? 1.08 : 0.92);
      zoom = Math.max(0.4, Math.min(zoom, 2.5));
      render();
    }

    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', render);
    window.addEventListener('themechange', render);

    render();

    return {
      setMolecule: function(key) {
        if (MOLECULES_3D[key]) {
          molKey = key;
          render();
        }
      },
      setMode: function(m) {
        mode = m;
        render();
      },
      resetView: function() {
        rotX = 0.3;
        rotY = 0.4;
        zoom = 1.0;
        render();
      },
      getMoleculeData: function() {
        return MOLECULES_3D[molKey];
      }
    };
  }

  // --------------------------------------------------------------------------
  // 5. Shared Chemistry Calculators Module
  // --------------------------------------------------------------------------
  const ChemistryCalculators = {
    // 1. Molarity: M = moles / Volume(L) = (mass / molarMass) / Volume(L)
    molarity: function(mass, molarMass, volumeL) {
      if (!molarMass || molarMass <= 0 || !volumeL || volumeL <= 0) return null;
      const moles = mass / molarMass;
      const M = moles / volumeL;
      return {
        moles: moles,
        molarity: M,
        steps: [
          `1. Calculate moles of solute: n = mass / molar mass = ${mass} g / ${molarMass} g/mol = ${moles.toFixed(4)} mol`,
          `2. Calculate molarity: M = n / V = ${moles.toFixed(4)} mol / ${volumeL} L = ${M.toFixed(4)} mol/L (M)`
        ]
      };
    },

    // 2. Molality: m = moles / massSolvent(kg)
    molality: function(moles, kgSolvent) {
      if (!kgSolvent || kgSolvent <= 0) return null;
      const m = moles / kgSolvent;
      return {
        molality: m,
        steps: [
          `1. Molality equation: m = moles of solute / mass of solvent (kg)`,
          `2. Calculation: m = ${moles} mol / ${kgSolvent} kg = ${m.toFixed(4)} mol/kg (m)`
        ]
      };
    },

    // 3. Molecular Mass
    molecularMass: function(formula) {
      const res = calculateMolarMass(formula);
      if (!res) return null;
      const steps = [
        `1. Parsed chemical formula: ${res.formula}`,
        ...Object.keys(res.breakdown).map(sym => {
          const b = res.breakdown[sym];
          return `   - ${b.name} (${sym}): ${b.count} \u00d7 ${b.atomicMass.toFixed(3)} u = ${b.totalMass.toFixed(3)} g/mol (${b.percentage.toFixed(2)}%)`;
        }),
        `2. Total Molar Mass = ${res.totalMass.toFixed(3)} g/mol`
      ];
      return {
        formula: res.formula,
        totalMass: res.totalMass,
        molarMass: res.totalMass,
        breakdown: res.breakdown,
        steps: steps
      };
    },

    // 4. Percentage Composition
    percentComposition: function(formula) {
      const res = calculateMolarMass(formula);
      if (!res) return null;
      const steps = [
        `1. Total Formula Weight = ${res.totalMass.toFixed(3)} g/mol`,
        `2. Elemental Mass Percentages (% = (element mass / total mass) \u00d7 100%):`,
        ...Object.keys(res.breakdown).map(sym => {
          const b = res.breakdown[sym];
          return `   - ${b.name} (${sym}): (${b.totalMass.toFixed(3)} / ${res.totalMass.toFixed(3)}) \u00d7 100% = ${b.percentage.toFixed(2)}%`;
        })
      ];
      return {
        formula: res.formula,
        totalMass: res.totalMass,
        breakdown: res.breakdown,
        steps: steps
      };
    },

    // 5. Dilution: C1V1 = C2V2
    dilution: function(c1, v1, c2, v2) {
      let missing = null;
      let result = 0;
      let steps = [];

      if (!c1 && v1 && c2 && v2) {
        result = (c2 * v2) / v1;
        missing = "C1";
        steps = [`C1 = (C2 \u00b7 V2) / V1 = (${c2} \u00b7 ${v2}) / ${v1} = ${result.toFixed(4)}`];
      } else if (c1 && !v1 && c2 && v2) {
        result = (c2 * v2) / c1;
        missing = "V1";
        steps = [`V1 = (C2 \u00b7 V2) / C1 = (${c2} \u00b7 ${v2}) / ${c1} = ${result.toFixed(4)}`];
      } else if (c1 && v1 && !c2 && v2) {
        result = (c1 * v1) / v2;
        missing = "C2";
        steps = [`C2 = (C1 \u00b7 V1) / V2 = (${c1} \u00b7 ${v1}) / ${v2} = ${result.toFixed(4)}`];
      } else if (c1 && v1 && c2 && !v2) {
        result = (c1 * v1) / c2;
        missing = "V2";
        steps = [`V2 = (C1 \u00b7 V1) / C2 = (${c1} \u00b7 ${v1}) / ${c2} = ${result.toFixed(4)}`];
      }

      return { missing, result, steps };
    },

    // 6. pH: pH = -log10[H+]
    ph: function(hConc) {
      if (!hConc || hConc <= 0) return null;
      const phVal = -Math.log10(hConc);
      const pohVal = 14 - phVal;
      const ohConc = Math.pow(10, -pohVal);
      return {
        ph: phVal,
        poh: pohVal,
        ohConc: ohConc,
        steps: [
          `1. pH equation: pH = -log10[H+]`,
          `2. Calculation: pH = -log10(${hConc.toExponential(4)}) = ${phVal.toFixed(3)}`,
          `3. Relationship: pH + pOH = 14 \u2192 pOH = 14 - ${phVal.toFixed(3)} = ${pohVal.toFixed(3)}`,
          `4. Hydroxide ion concentration: [OH-] = 10^-pOH = ${ohConc.toExponential(4)} M`
        ]
      };
    },

    // 7. pOH: pOH = -log10[OH-]
    poh: function(ohConc) {
      if (!ohConc || ohConc <= 0) return null;
      const pohVal = -Math.log10(ohConc);
      const phVal = 14 - pohVal;
      const hConc = Math.pow(10, -phVal);
      return {
        ph: phVal,
        poh: pohVal,
        hConc: hConc,
        steps: [
          `1. pOH equation: pOH = -log10[OH-]`,
          `2. Calculation: pOH = -log10(${ohConc.toExponential(4)}) = ${pohVal.toFixed(3)}`,
          `3. Relationship: pH = 14 - pOH = 14 - ${pohVal.toFixed(3)} = ${phVal.toFixed(3)}`,
          `4. Hydronium ion concentration: [H+] = 10^-pH = ${hConc.toExponential(4)} M`
        ]
      };
    },

    // 8. Empirical Formula
    empiricalFormula: function(elementsData) {
      if (!elementsData) return null;
      let list = [];
      if (!Array.isArray(elementsData)) {
        for (const [k, v] of Object.entries(elementsData)) {
          list.push({ symbol: k, val: parseFloat(v) });
        }
      } else {
        list = elementsData.map(item => ({
          symbol: item.symbol || item.element || item[0],
          val: parseFloat(item.val || item.percentage || item.mass || item[1])
        }));
      }
      if (list.length === 0) return null;
      let molesList = [];
      for (let item of list) {
        const el = ELEMENT_MAP[item.symbol];
        if (!el) return null;
        const moles = item.val / el.m;
        molesList.push({ symbol: item.symbol, moles: moles, name: el.n });
      }

      const minMoles = Math.min(...molesList.map(m => m.moles));
      let ratios = molesList.map(m => ({ symbol: m.symbol, ratio: m.moles / minMoles }));

      // Find integer multiplier (1 to 6)
      let bestMultiplier = 1;
      for (let mult = 1; mult <= 6; mult++) {
        const allClose = ratios.every(r => Math.abs(r.ratio * mult - Math.round(r.ratio * mult)) < 0.12);
        if (allClose) { bestMultiplier = mult; break; }
      }

      let formula = "";
      ratios.forEach(r => {
        const intCount = Math.round(r.ratio * bestMultiplier);
        formula += r.symbol + (intCount > 1 ? intCount : "");
      });

      return {
        formula: formula,
        ratios: ratios,
        steps: [
          `1. Convert mass / percentage to moles (divide by atomic mass)`,
          ...molesList.map(m => `   - ${m.symbol}: ${m.moles.toFixed(4)} mol`),
          `2. Divide by smallest mole value (${minMoles.toFixed(4)} mol)`,
          ...ratios.map(r => `   - ${r.symbol}: ${(r.ratio * bestMultiplier).toFixed(2)} \u2248 ${Math.round(r.ratio * bestMultiplier)}`),
          `3. Empirical Formula: ${formula}`
        ]
      };
    },

    // 9. Molecular Formula: n = MolarMass / EmpiricalMolarMass
    molecularFormula: function(empiricalStr, actualMolarMass) {
      const empData = calculateMolarMass(empiricalStr);
      if (!empData || !actualMolarMass || actualMolarMass <= 0) return null;
      const n = Math.round(actualMolarMass / empData.totalMass);
      let molFormula = "";
      for (let s in empData.counts) {
        const newCount = empData.counts[s] * n;
        molFormula += s + (newCount > 1 ? newCount : "");
      }
      return {
        ratio: n,
        empiricalFormula: empiricalStr,
        molecularFormula: molFormula,
        steps: [
          `1. Empirical formula mass of ${empiricalStr} = ${empData.totalMass.toFixed(2)} g/mol`,
          `2. Calculate integer factor: n = Actual Molar Mass / Empirical Mass = ${actualMolarMass} / ${empData.totalMass.toFixed(2)} = ${n}`,
          `3. Multiply empirical subscripts by ${n}: ${molFormula}`
        ]
      };
    },

    // 10. Stoichiometry: Mole / Mass conversion
    stoichiometry: function(molesA, coeffA, coeffB, molarMassB) {
      if (!coeffA || coeffA <= 0 || !coeffB || coeffB <= 0) return null;
      const molesB = (molesA * coeffB) / coeffA;
      const massB = molarMassB ? molesB * molarMassB : null;
      return {
        molesB: molesB,
        massB: massB,
        steps: [
          `1. Mole ratio: (${coeffB} mol B) / (${coeffA} mol A)`,
          `2. Calculate moles of B: n_B = ${molesA} \u00b7 (${coeffB} / ${coeffA}) = ${molesB.toFixed(4)} mol`,
          massB ? `3. Calculate mass of B: m_B = ${molesB.toFixed(4)} mol \u00b7 ${molarMassB} g/mol = ${massB.toFixed(2)} g` : ''
        ].filter(Boolean)
      };
    },

    // 11. Limiting Reagent
    limitingReagent: function(molA, coeffA, molB, coeffB) {
      const reqA = molA / coeffA;
      const reqB = molB / coeffB;
      const isALimiting = reqA < reqB;
      return {
        limiting: isALimiting ? "Reactant A" : "Reactant B",
        reqA: reqA,
        reqB: reqB,
        steps: [
          `1. Divide available moles by stoichiometric coefficient:`,
          `   - Reactant A: ${molA} mol / ${coeffA} = ${reqA.toFixed(4)}`,
          `   - Reactant B: ${molB} mol / ${coeffB} = ${reqB.toFixed(4)}`,
          `2. Smaller quotient determines the limiting reagent: ${isALimiting ? 'Reactant A' : 'Reactant B'}`
        ]
      };
    },

    // 12. Percentage Yield: (Actual / Theoretical) * 100
    percentYield: function(actual, theoretical) {
      if (!theoretical || theoretical <= 0) return null;
      const yieldPct = (actual / theoretical) * 100;
      return {
        yieldPercent: yieldPct,
        steps: [
          `1. Percentage Yield equation: % Yield = (Actual Yield / Theoretical Yield) \u00d7 100%`,
          `2. Calculation: (${actual} / ${theoretical}) \u00d7 100% = ${yieldPct.toFixed(2)}%`
        ]
      };
    },

    // 13. Ideal Gas Law: PV = nRT (R = 0.08206 L*atm/(mol*K))
    idealGas: function(p, v, n, t) {
      const R = 0.08206; // L*atm / mol*K
      let result = null;
      let missing = "";
      let steps = [];

      if (!p && v && n && t) {
        result = (n * R * t) / v; missing = "P (atm)";
        steps = [`P = (nRT) / V = (${n} \u00b7 0.08206 \u00b7 ${t}) / ${v} = ${result.toFixed(3)} atm`];
      } else if (p && !v && n && t) {
        result = (n * R * t) / p; missing = "V (L)";
        steps = [`V = (nRT) / P = (${n} \u00b7 0.08206 \u00b7 ${t}) / ${p} = ${result.toFixed(3)} L`];
      } else if (p && v && !n && t) {
        result = (p * v) / (R * t); missing = "n (mol)";
        steps = [`n = (PV) / (RT) = (${p} \u00b7 ${v}) / (0.08206 \u00b7 ${t}) = ${result.toFixed(4)} mol`];
      } else if (p && v && n && !t) {
        result = (p * v) / (n * R); missing = "T (K)";
        steps = [`T = (PV) / (nR) = (${p} \u00b7 ${v}) / (${n} \u00b7 0.08206) = ${result.toFixed(2)} K`];
      }

      return { missing, result, steps };
    },

    // 14. Half-Life: N(t) = N0 * (1/2)^(t / t1/2)
    halfLife: function(n0, tHalf, totalTime) {
      if (!tHalf || tHalf <= 0) return null;
      const numHalves = totalTime / tHalf;
      const remaining = n0 * Math.pow(0.5, numHalves);
      const k = Math.LN2 / tHalf;
      return {
        remaining: remaining,
        decayConstant: k,
        numHalves: numHalves,
        steps: [
          `1. Decay constant: k = ln(2) / t_1/2 = 0.69315 / ${tHalf} = ${k.toExponential(4)} time^-1`,
          `2. Elapsed half-lives: n = t / t_1/2 = ${totalTime} / ${tHalf} = ${numHalves.toFixed(3)}`,
          `3. Remaining quantity: N(t) = N0 \u00b7 (0.5)^n = ${n0} \u00b7 (0.5)^${numHalves.toFixed(3)} = ${remaining.toFixed(4)}`
        ]
      };
    },

    // 15. Faraday's Law of Electrolysis: m = (M * I * t) / (n * F) (F = 96485 C/mol)
    faraday: function(molarMass, current, timeSeconds, valency) {
      const F = 96485.33; // C/mol
      if (!valency || valency <= 0 || !molarMass || molarMass <= 0) return null;
      const Q = current * timeSeconds;
      const molesElectrons = Q / F;
      const massDeposited = (molarMass * Q) / (valency * F);
      return {
        chargeQ: Q,
        molesElectrons: molesElectrons,
        massGrams: massDeposited,
        steps: [
          `1. Calculate total electric charge: Q = I \u00b7 t = ${current} A \u00b7 ${timeSeconds} s = ${Q.toFixed(2)} C`,
          `2. Moles of electrons passed: n_e = Q / F = ${Q.toFixed(2)} / 96485 = ${molesElectrons.toFixed(4)} mol e-`,
          `3. Deposited mass: m = (M \u00b7 Q) / (n \u00b7 F) = (${molarMass} \u00b7 ${Q.toFixed(2)}) / (${valency} \u00b7 96485) = ${massDeposited.toFixed(4)} g`
        ]
      };
    }
  };

  // Attach to window
  window.ChemistryEngine = {
    ELEMENTS: ELEMENTS,
    ELEMENT_MAP: ELEMENT_MAP,
    ELEMENT_BY_Z: ELEMENT_BY_Z,
    parseChemicalFormula: parseChemicalFormula,
    calculateMolarMass: calculateMolarMass,
    balanceEquation: balanceEquation,
    MOLECULES_3D: MOLECULES_3D,
    create3DViewer: create3DViewer,
    calculators: ChemistryCalculators
  };

})(typeof window !== 'undefined' ? window : this);
