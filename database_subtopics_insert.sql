-- Insert all Core subtopics with full syllabus data
INSERT INTO igcse_subtopics (topic_id, code, title, paper_type, notes_and_examples, order_index) VALUES

-- Topic 1: Number (get topic_id from igcse_topics where code = '1')
((SELECT id FROM igcse_topics WHERE code = '1'), 'C1.1', 'Types of number', 'Core', 'Identify and use: natural numbers, integers (positive, zero and negative), prime numbers, square numbers, cube numbers, common factors, common multiples, rational and irrational numbers, reciprocals. Example: express 72 as a product of its prime factors; find the HCF and LCM of two numbers.', 1),
((SELECT id FROM igcse_topics WHERE code = '1'), 'C1.2', 'Sets', 'Core', 'Understand and use set language, notation and Venn diagrams to describe sets. Venn diagrams are limited to two sets. Notation: A ∪ B (Union), A ∩ B (Intersection), n(A) (Number of elements), A′ (Complement).', 2),
((SELECT id FROM igcse_topics WHERE code = '1'), 'C1.3', 'Powers and roots', 'Core', 'Calculate with squares, square roots, cubes, cube roots, other powers and roots. Recall squares 1-15 and cubes of 1,2,3,4,5,10. Example: Write down √169, Work out ∛8.', 3),
((SELECT id FROM igcse_topics WHERE code = '1'), 'C1.4', 'Fractions, decimals and percentages', 'Core', 'Use proper fractions, improper fractions, mixed numbers, decimals, percentages. Write fractions in simplest form. Convert between these forms (recurring decimals not required for Core).', 4),
((SELECT id FROM igcse_topics WHERE code = '1'), 'C1.5', 'Ordering', 'Core', 'Order quantities by magnitude and demonstrate familiarity with symbols =, ≠, >, <, ≥, ≤', 5),
((SELECT id FROM igcse_topics WHERE code = '1'), 'C1.6', 'The four operations', 'Core', 'Use four operations for calculations with integers, fractions and decimals, including correct ordering of operations and use of brackets. Includes negative numbers, practical situations.', 6),
((SELECT id FROM igcse_topics WHERE code = '1'), 'C1.7', 'Indices I', 'Core', 'Understand and use indices (positive, zero and negative integers). Use rules of indices. Example: find value of 7⁻², 2⁻³ × 2⁴, (2³)².', 7),
((SELECT id FROM igcse_topics WHERE code = '1'), 'C1.8', 'Standard form', 'Core', 'Use standard form A × 10ⁿ where n is positive or negative integer and 1 ≤ A < 10. Convert numbers into and out of standard form. Calculate with values in standard form.', 8),

-- Topic 2: Algebra and graphs  
((SELECT id FROM igcse_topics WHERE code = '2'), 'C2.1', 'Introduction to algebra', 'Core', 'Know that letters can be used to represent generalised numbers. Substitute numbers into expressions and formulas.', 1),
((SELECT id FROM igcse_topics WHERE code = '2'), 'C2.2', 'Algebraic manipulation', 'Core', 'Simplify expressions by collecting like terms. Expand products of algebraic expressions. Factorise by extracting common factors. Example: expand 3x(2x - 4y), factorise 9x² + 15xy.', 2),
((SELECT id FROM igcse_topics WHERE code = '2'), 'C2.4', 'Indices II', 'Core', 'Understand and use indices (positive, zero and negative). Use rules of indices. Example: 2ˣ = 32, find x. Simplify (5x³)², 12a⁵ ÷ 3a⁻².', 3),
((SELECT id FROM igcse_topics WHERE code = '2'), 'C2.5', 'Equations', 'Core', 'Construct simple expressions, equations and formulas. Solve linear equations in one unknown. Solve simultaneous linear equations in two unknowns. Change subject of simple formulas.', 4),
((SELECT id FROM igcse_topics WHERE code = '2'), 'C2.6', 'Inequalities', 'Core', 'Represent and interpret inequalities, including on a number line. Use open circles for strict inequalities (<, >), closed circles for inclusive inequalities (≤, ≥).', 5),
((SELECT id FROM igcse_topics WHERE code = '2'), 'C2.7', 'Sequences', 'Core', 'Continue number sequences or patterns. Recognise patterns including term-to-term rule. Find nth term of linear, simple quadratic, and simple cubic sequences.', 6),

-- Topic 3: Coordinate geometry
((SELECT id FROM igcse_topics WHERE code = '3'), 'C3.1', 'Coordinates', 'Core', 'Use and interpret Cartesian coordinates in two dimensions.', 1),
((SELECT id FROM igcse_topics WHERE code = '3'), 'C3.2', 'Drawing linear graphs', 'Core', 'Draw straight-line graphs for linear equations. Equations given in form y = mx + c unless table of values is provided.', 2),
((SELECT id FROM igcse_topics WHERE code = '3'), 'C3.3', 'Gradient of linear graphs', 'Core', 'Find the gradient of a straight line from a grid only.', 3),
((SELECT id FROM igcse_topics WHERE code = '3'), 'C3.5', 'Equations of linear graphs', 'Core', 'Interpret and obtain equation of straight-line graph in form y = mx + c. Find gradient and y-intercept from equation.', 4),
((SELECT id FROM igcse_topics WHERE code = '3'), 'C3.6', 'Parallel lines', 'Core', 'Find gradient and equation of straight line parallel to a given line. Example: line parallel to y = 4x - 1 through point (1, -3).', 5),

-- Topic 4: Geometry
((SELECT id FROM igcse_topics WHERE code = '4'), 'C4.1', 'Geometrical terms', 'Core', 'Use geometrical terms: point, vertex, line, parallel, perpendicular, bearing, angles, similar, congruent, scale factor. Vocabulary of triangles, quadrilaterals, polygons, solids, circles.', 1),
((SELECT id FROM igcse_topics WHERE code = '4'), 'C4.2', 'Geometrical constructions', 'Core', 'Measure and draw lines and angles. Construct triangle given all side lengths using ruler and compasses. Draw, use and interpret nets of 3D shapes.', 2),
((SELECT id FROM igcse_topics WHERE code = '4'), 'C4.3', 'Scale drawings', 'Core', 'Draw and interpret scale drawings. Use and interpret three-figure bearings (000° to 360°, measured clockwise from north).', 3),
((SELECT id FROM igcse_topics WHERE code = '4'), 'C4.4', 'Similarity', 'Core', 'Calculate lengths of similar shapes.', 4),
((SELECT id FROM igcse_topics WHERE code = '4'), 'C4.5', 'Symmetry', 'Core', 'Recognise line symmetry and order of rotational symmetry in two dimensions. Properties of triangles, quadrilaterals and polygons related to symmetries.', 5),
((SELECT id FROM igcse_topics WHERE code = '4'), 'C4.6', 'Angles', 'Core', 'Calculate unknown angles using: sum of angles at point = 360°, angles on straight line = 180°, vertically opposite angles equal, triangle angle sum = 180°, quadrilateral angle sum = 360°, parallel lines properties.', 6),
((SELECT id FROM igcse_topics WHERE code = '4'), 'C4.7', 'Circle theorems', 'Core', 'Calculate unknown angles using: angle in semicircle = 90°, angle between tangent and radius = 90°.', 7),

-- Topic 5: Mensuration  
((SELECT id FROM igcse_topics WHERE code = '5'), 'C5.1', 'Units of measure', 'Core', 'Use metric units of mass, length, area, volume and capacity. Convert between units including area (cm² ↔ m²) and volume/capacity (m³ ↔ litres).', 1),
((SELECT id FROM igcse_topics WHERE code = '5'), 'C5.2', 'Area and perimeter', 'Core', 'Calculate perimeter and area of rectangle, triangle, parallelogram and trapezium. Area of triangle formula not given.', 2),
((SELECT id FROM igcse_topics WHERE code = '5'), 'C5.3', 'Circles, arcs and sectors', 'Core', 'Calculate circumference and area of circle. Calculate arc length and sector area as fractions where sector angle is factor of 360°. Answers may be in terms of π.', 3),
((SELECT id FROM igcse_topics WHERE code = '5'), 'C5.4', 'Surface area and volume', 'Core', 'Calculate surface area and volume of: cuboid, prism, cylinder, sphere, pyramid, cone. Formulas given in formula list. Answers may be in terms of π.', 4),
((SELECT id FROM igcse_topics WHERE code = '5'), 'C5.5', 'Compound shapes and parts of shapes', 'Core', 'Calculate perimeters, areas, surface areas and volumes of compound shapes and parts of shapes. Example: volume of half sphere.', 5),

-- Topic 6: Trigonometry
((SELECT id FROM igcse_topics WHERE code = '6'), 'C6.1', 'Pythagoras theorem', 'Core', 'Know and use Pythagoras theorem.', 1),
((SELECT id FROM igcse_topics WHERE code = '6'), 'C6.2', 'Right-angled triangles', 'Core', 'Know and use sine, cosine and tangent ratios for acute angles. Solve problems in two dimensions using Pythagoras and trigonometry. Knowledge of bearings may be required.', 2),

-- Topic 7: Transformations and vectors
((SELECT id FROM igcse_topics WHERE code = '7'), 'C7.1', 'Transformations', 'Core', 'Recognise, describe and draw: reflection (in vertical or horizontal line), rotation (about origin/vertices/midpoints through multiples of 90°), enlargement (positive and fractional scale factors), translation (by vector).', 1),

-- Topic 8: Probability  
((SELECT id FROM igcse_topics WHERE code = '8'), 'C8.1', 'Introduction to probability', 'Core', 'Understand probability scale 0 to 1. Calculate probability of single event. Understand P(not A) = 1 - P(A). Use information from tables, graphs, Venn diagrams (max 2 sets).', 1),
((SELECT id FROM igcse_topics WHERE code = '8'), 'C8.2', 'Relative and expected frequencies', 'Core', 'Understand relative frequency as estimate of probability. Calculate expected frequencies. Understand fair, bias, random concepts.', 2),
((SELECT id FROM igcse_topics WHERE code = '8'), 'C8.3', 'Probability of combined events', 'Core', 'Calculate probability of combined events using sample space diagrams, Venn diagrams (max 2 sets), tree diagrams. Combined events with replacement only.', 3),

-- Topic 9: Statistics
((SELECT id FROM igcse_topics WHERE code = '9'), 'C9.1', 'Classifying statistical data', 'Core', 'Classify and tabulate statistical data using tally tables, two-way tables.', 1),
((SELECT id FROM igcse_topics WHERE code = '9'), 'C9.2', 'Interpreting statistical data', 'Core', 'Read, interpret and draw inferences from tables and statistical diagrams. Compare sets of data using tables, graphs and statistical measures. Appreciate restrictions on drawing conclusions.', 2),
((SELECT id FROM igcse_topics WHERE code = '9'), 'C9.3', 'Averages and range', 'Core', 'Calculate mean, median, mode and range for individual data and distinguish between purposes. Data may be in list or frequency table but not grouped.', 3),
((SELECT id FROM igcse_topics WHERE code = '9'), 'C9.4', 'Statistical charts and diagrams', 'Core', 'Draw and interpret: bar charts, pie charts (including composite and dual), pictograms, stem-and-leaf diagrams (with ordered data and key), simple frequency distributions.', 4),
((SELECT id FROM igcse_topics WHERE code = '9'), 'C9.5', 'Scatter diagrams', 'Core', 'Draw and interpret scatter diagrams. Understand positive, negative and zero correlation. Draw by eye, interpret and use straight line of best fit.', 5)

ON CONFLICT (code) DO NOTHING;
