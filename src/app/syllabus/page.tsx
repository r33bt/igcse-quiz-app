"use client"

import { useState } from 'react'
import AppNavigation from '@/components/AppNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const syllabusData = {
  core: {
    "1": {
      name: "Number",
      color: "#3B82F6",
      subtopics: {
        "C1.1": { title: "Types of number", notes: "Identify and use: natural numbers, integers (positive, zero and negative), prime numbers, square numbers, cube numbers, common factors, common multiples, rational and irrational numbers, reciprocals." },
        "C1.2": { title: "Sets", notes: "Understand and use set language, notation and Venn diagrams to describe sets. Venn diagrams are limited to two sets." },
        "C1.3": { title: "Powers and roots", notes: "Calculate with squares, square roots, cubes, cube roots, other powers and roots of numbers." },
        "C1.4": { title: "Fractions, decimals and percentages", notes: "Use proper fractions, improper fractions, mixed numbers, decimals, percentages in appropriate contexts." }
      }
    },
    "2": {
      name: "Algebra and graphs", 
      color: "#10B981",
      subtopics: {
        "C2.1": { title: "Introduction to algebra", notes: "Know that letters can be used to represent generalised numbers. Substitute numbers into expressions and formulas." },
        "C2.2": { title: "Algebraic manipulation", notes: "Simplify expressions by collecting like terms. Expand products of algebraic expressions." }
      }
    }
  }
}

export default function SyllabusPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppNavigation title="IGCSE Mathematics Syllabus" showBackButton={true} backUrl="/" />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Cambridge IGCSE Mathematics 0580 Syllabus
          </h1>
          <p className="text-gray-600 mb-6">
            Complete syllabus breakdown for 2025-2027. Navigate through topics and subtopics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(syllabusData.core).map(([topicNum, topic]) => (
            <Card key={topicNum} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedTopic(selectedTopic === topicNum ? null : topicNum)}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: topic.color }}
                  >
                    {topicNum}
                  </div>
                  <div>
                    <CardTitle>{topic.name}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {Object.keys(topic.subtopics).length} subtopics
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              {selectedTopic === topicNum && (
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(topic.subtopics).map(([code, subtopic]) => (
                      <div key={code} className="border-l-2 border-gray-200 pl-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline">{code}</Badge>
                          <h4 className="font-medium">{subtopic.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          {subtopic.notes}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
