"use client"

import { useState } from 'react'
import AppNavigation from '@/components/AppNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const syllabusData = {
  "1": {
    name: "Number",
    color: "#3B82F6",
    subtopics: {
      "C1.1": { title: "Types of number", notes: "Identify and use: natural numbers, integers, prime numbers, square numbers, cube numbers, common factors, common multiples, rational and irrational numbers, reciprocals." },
      "C1.2": { title: "Sets", notes: "Understand and use set language, notation and Venn diagrams to describe sets. Venn diagrams are limited to two sets." },
      "C1.3": { title: "Powers and roots", notes: "Calculate with squares, square roots, cubes, cube roots, other powers and roots of numbers." },
      "C1.4": { title: "Fractions, decimals and percentages", notes: "Use proper fractions, improper fractions, mixed numbers, decimals, percentages in appropriate contexts." },
      "C1.5": { title: "Ordering", notes: "Order quantities by magnitude and demonstrate familiarity with symbols =, ≠, >, <, ≥, ≤" },
      "C1.6": { title: "The four operations", notes: "Use the four operations for calculations with integers, fractions and decimals, including correct ordering of operations." },
      "C1.7": { title: "Indices I", notes: "Understand and use indices (positive, zero and negative integers). Understand and use the rules of indices." },
      "C1.8": { title: "Standard form", notes: "Use standard form A × 10ⁿ where n is a positive or negative integer and 1 ≤ A < 10." }
    }
  },
  "2": {
    name: "Algebra and graphs",
    color: "#10B981",
    subtopics: {
      "C2.1": { title: "Introduction to algebra", notes: "Know that letters can be used to represent generalised numbers. Substitute numbers into expressions and formulas." },
      "C2.2": { title: "Algebraic manipulation", notes: "Simplify expressions by collecting like terms. Expand products of algebraic expressions. Factorise by extracting common factors." },
      "C2.4": { title: "Indices II", notes: "Understand and use indices (positive, zero and negative). Understand and use the rules of indices." },
      "C2.5": { title: "Equations", notes: "Construct simple expressions, equations and formulas. Solve linear equations in one unknown." },
      "C2.6": { title: "Inequalities", notes: "Represent and interpret inequalities, including on a number line." },
      "C2.7": { title: "Sequences", notes: "Continue a given number sequence or pattern. Recognise patterns in sequences." }
    }
  },
  "3": {
    name: "Coordinate geometry",
    color: "#F59E0B",
    subtopics: {
      "C3.1": { title: "Coordinates", notes: "Use and interpret Cartesian coordinates in two dimensions." },
      "C3.2": { title: "Drawing linear graphs", notes: "Draw straight-line graphs for linear equations." },
      "C3.3": { title: "Gradient of linear graphs", notes: "Find the gradient of a straight line from a grid." },
      "C3.5": { title: "Equations of linear graphs", notes: "Interpret and obtain the equation of a straight-line graph in the form y = mx + c." },
      "C3.6": { title: "Parallel lines", notes: "Find the gradient and equation of a straight line parallel to a given line." }
    }
  },
  "4": {
    name: "Geometry",
    color: "#EF4444",
    subtopics: {
      "C4.1": { title: "Geometrical terms", notes: "Use and interpret geometrical terms: point, vertex, line, parallel, perpendicular, bearing, angles, similar, congruent." },
      "C4.2": { title: "Geometrical constructions", notes: "Measure and draw lines and angles. Construct triangles using ruler and compasses. Draw and interpret nets." },
      "C4.3": { title: "Scale drawings", notes: "Draw and interpret scale drawings. Use and interpret three-figure bearings." },
      "C4.4": { title: "Similarity", notes: "Calculate lengths of similar shapes." },
      "C4.5": { title: "Symmetry", notes: "Recognise line symmetry and order of rotational symmetry in two dimensions." },
      "C4.6": { title: "Angles", notes: "Calculate unknown angles using geometrical properties: angle sum of triangle = 180°, parallel lines properties." },
      "C4.7": { title: "Circle theorems", notes: "Calculate unknown angles using: angle in a semicircle = 90°, angle between tangent and radius = 90°." }
    }
  },
  "5": {
    name: "Mensuration",
    color: "#8B5CF6",
    subtopics: {
      "C5.1": { title: "Units of measure", notes: "Use metric units of mass, length, area, volume and capacity in practical situations." },
      "C5.2": { title: "Area and perimeter", notes: "Carry out calculations involving perimeter and area of rectangle, triangle, parallelogram and trapezium." },
      "C5.3": { title: "Circles, arcs and sectors", notes: "Carry out calculations involving circumference and area of a circle. Calculate arc length and sector area." },
      "C5.4": { title: "Surface area and volume", notes: "Calculate surface area and volume of cuboid, prism, cylinder, sphere, pyramid, cone." },
      "C5.5": { title: "Compound shapes", notes: "Calculate perimeters, areas, surface areas and volumes of compound shapes and parts of shapes." }
    }
  },
  "6": {
    name: "Trigonometry",
    color: "#06B6D4",
    subtopics: {
      "C6.1": { title: "Pythagoras' theorem", notes: "Know and use Pythagoras' theorem." },
      "C6.2": { title: "Right-angled triangles", notes: "Know and use sine, cosine and tangent ratios for acute angles. Solve problems in two dimensions." }
    }
  },
  "7": {
    name: "Transformations and vectors",
    color: "#84CC16",
    subtopics: {
      "C7.1": { title: "Transformations", notes: "Recognise, describe and draw: reflection, rotation, enlargement, translation. Use vectors for translation." }
    }
  },
  "8": {
    name: "Probability",
    color: "#EC4899",
    subtopics: {
      "C8.1": { title: "Introduction to probability", notes: "Understand and use probability scale from 0 to 1. Calculate probability of a single event." },
      "C8.2": { title: "Relative and expected frequencies", notes: "Understand relative frequency as estimate of probability. Calculate expected frequencies." },
      "C8.3": { title: "Probability of combined events", notes: "Calculate probability of combined events using sample space diagrams, Venn diagrams, tree diagrams." }
    }
  },
  "9": {
    name: "Statistics",
    color: "#F97316",
    subtopics: {
      "C9.1": { title: "Classifying statistical data", notes: "Classify and tabulate statistical data using tally tables, two-way tables." },
      "C9.2": { title: "Interpreting statistical data", notes: "Read, interpret and draw inferences from tables and statistical diagrams." },
      "C9.3": { title: "Averages and range", notes: "Calculate mean, median, mode and range for individual data and distinguish between their purposes." },
      "C9.4": { title: "Statistical charts and diagrams", notes: "Draw and interpret: bar charts, pie charts, pictograms, stem-and-leaf diagrams, frequency distributions." },
      "C9.5": { title: "Scatter diagrams", notes: "Draw and interpret scatter diagrams. Understand positive, negative and zero correlation. Draw line of best fit." }
    }
  }
}

export default function SyllabusPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppNavigation title="IGCSE Mathematics Syllabus" showBackButton={true} backUrl="/" />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Cambridge IGCSE Mathematics 0580 Syllabus
          </h1>
          <p className="text-gray-600 mb-6">
            Complete Core syllabus breakdown for 2025-2027. Click on any topic to explore subtopics and learning objectives.
          </p>
          
          <div className="bg-white rounded-lg p-4 mb-6 border">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>9 Core Topics</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>45+ Subtopics</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>Extended content available</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(syllabusData).map(([topicNum, topic]) => (
            <Card key={topicNum} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedTopic(selectedTopic === topicNum ? null : topicNum)}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: topic.color }}
                  >
                    {topicNum}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{topic.name}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {Object.keys(topic.subtopics).length} subtopics
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              {selectedTopic === topicNum && (
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(topic.subtopics).map(([code, subtopic]) => (
                      <div key={code} className="border-l-3 pl-4" style={{ borderColor: topic.color }}>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-xs font-mono">{code}</Badge>
                          <h4 className="font-semibold text-gray-900">{subtopic.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {subtopic.notes}
                        </p>
                      </div>
                    ))}
                    
                    <div className="mt-4 pt-4 border-t">
                      <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                        🎯 Practice {topic.name} Questions
                      </button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-6 inline-block">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready for Extended Paper?</h3>
            <p className="text-gray-600 mb-4">Extended paper includes all Core content plus advanced topics</p>
            <Badge className="bg-yellow-100 text-yellow-800">Extended Syllabus Coming Soon</Badge>
          </div>
        </div>
      </main>
    </div>
  )
}
