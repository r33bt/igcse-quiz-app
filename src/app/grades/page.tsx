"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  FileText,
  Calendar,
  Target,
  Info,
  Download
} from 'lucide-react'
import AppNavigation from '@/components/AppNavigation'
import Link from 'next/link'

export default function GradesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppNavigation title="IGCSE Grading System" showBackButton={true} backUrl="/" />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cambridge IGCSE Mathematics Grading System
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Comprehensive guide to IGCSE Mathematics (0580) grade boundaries, historical trends, 
            and official Cambridge International Education documentation.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Last Updated: August 2025 • Based on Official Cambridge Data</span>
          </div>
        </div>

        {/* Quick Reference Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Core Paper Quick Reference */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Core Paper (Papers 1 & 3)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm font-semibold text-blue-900 mb-2">June 2025 Boundaries</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Grade C:</span>
                      <span className="font-medium">54-58%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grade D:</span>
                      <span className="font-medium">43-48%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grade E:</span>
                      <span className="font-medium">32-39%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grade F:</span>
                      <span className="font-medium">21-30%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-l-yellow-400">
                  <div className="text-xs text-yellow-800">
                    <strong>Maximum Grade:</strong> C (regardless of percentage achieved)
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  Maximum: 160 marks (80 marks per paper)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extended Paper Quick Reference */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Extended Paper (Papers 2 & 4)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm font-semibold text-purple-900 mb-2">June 2025 Boundaries</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Grade A*:</span>
                      <span className="font-medium">88-89%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grade A:</span>
                      <span className="font-medium">76-78%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grade B:</span>
                      <span className="font-medium">60-64%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grade C:</span>
                      <span className="font-medium">43-49%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border-l-4 border-l-green-400">
                  <div className="text-xs text-green-800">
                    <strong>All Grades Available:</strong> A* through U based on performance
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  Maximum: 200 marks (100 marks per paper)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historical Trends */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Historical Grade Boundary Trends (2020-2025)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* COVID Impact Notice */}
            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-l-orange-400 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-orange-900 mb-1">COVID-19 Impact (2020-2024)</div>
                  <div className="text-sm text-orange-800 leading-relaxed">
                    Grade boundaries were significantly lowered during 2020-2024 due to disrupted learning. 
                    From 2025 onwards, boundaries have returned to pre-pandemic standards, resulting in higher 
                    percentage requirements for top grades.
                  </div>
                </div>
              </div>
            </div>

            {/* Extended Paper Trend Table */}
            <div className="overflow-x-auto mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Extended Paper A* Grade Boundaries</h4>
              <table className="w-full text-sm border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left">Session</th>
                    <th className="border border-gray-200 px-3 py-2 text-center">A* Threshold</th>
                    <th className="border border-gray-200 px-3 py-2 text-center">Trend</th>
                    <th className="border border-gray-200 px-3 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 font-medium">June 2025</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      <Badge variant="secondary">88-89%</Badge>
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      <TrendingUp className="h-4 w-4 text-green-600 mx-auto" />
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-xs">
                      Return to pre-COVID standards. BX option (78%) excluded as outlier.
                    </td>
                  </tr>
                  <tr className="bg-gray-25">
                    <td className="border border-gray-200 px-3 py-2 font-medium">March 2025</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      <Badge variant="secondary">85-87%</Badge>
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      <TrendingUp className="h-4 w-4 text-green-600 mx-auto" />
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-xs">
                      Transition period - boundaries increasing from COVID lows.
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 font-medium">June 2024</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      <Badge variant="outline">82-85%</Badge>
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      <TrendingUp className="h-4 w-4 text-green-600 mx-auto" />
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-xs">
                      Recovery phase - gradual increase from pandemic adjustments.
                    </td>
                  </tr>
                  <tr className="bg-yellow-25">
                    <td className="border border-gray-200 px-3 py-2 font-medium">2020-2023</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      <Badge variant="outline">75-82%</Badge>
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      <TrendingDown className="h-4 w-4 text-red-600 mx-auto" />
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-xs">
                      COVID-adjusted boundaries - significantly lowered due to disrupted learning.
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 font-medium">Pre-2020</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      <Badge variant="secondary">87-90%</Badge>
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      <div className="w-4 h-4 bg-gray-300 rounded mx-auto"></div>
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-xs">
                      Historical norm - consistent with current 2025 standards.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Core Paper Stability */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Core Paper Stability</h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                Core paper boundaries have remained relatively stable throughout all periods, typically 
                ranging 50-60% for Grade C across different sessions. The maximum grade limitation 
                to Grade C has been consistent since the syllabus introduction.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Official Sources */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Official Cambridge International Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                All grade boundary information is sourced directly from official Cambridge International 
                Education grade threshold documents. These documents are published after each examination 
                session and contain the exact mark requirements for each grade.
              </p>

              {/* Recent Official Documents */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900">June 2025</span>
                    <Badge className="bg-green-100 text-green-800">Latest</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Mathematics (without Coursework) 0580 - June 2025 Grade Threshold Table
                  </p>
                  <Link 
                    href="https://www.cambridgeinternational.org/Images/741420-mathematics-without-coursework-0580-june-2025-grade-threshold-table.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" className="w-full">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      View Official PDF
                    </Button>
                  </Link>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900">March 2025</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Mathematics (without Coursework) 0580 - March 2025 Grade Threshold Table
                  </p>
                  <Link 
                    href="https://www.cambridgeinternational.org/Images/735003-mathematics-without-coursework-0580-march-2025-grade-threshold-table.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="w-full">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      View Official PDF
                    </Button>
                  </Link>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900">June 2024</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Mathematics (without Coursework) 0580 - June 2024 Grade Threshold Table
                  </p>
                  <Link 
                    href="https://www.cambridgeinternational.org/Images/716164-mathematics-without-coursework-0580-june-2024-grade-threshold-table.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="w-full">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      View Official PDF
                    </Button>
                  </Link>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900">All Sessions</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Complete archive of grade threshold tables from Cambridge International
                  </p>
                  <Link 
                    href="https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-upper-secondary/cambridge-igcse/grade-threshold-tables/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="w-full">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Cambridge Archive
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paper Combination Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Understanding Paper Combinations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Core Combinations */}
              <div>
                <h4 className="font-semibold text-blue-900 mb-3">Core Paper Options</h4>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-medium text-sm mb-1">Option AY</div>
                    <div className="text-xs text-gray-600 mb-2">Papers 12 + 32</div>
                    <div className="text-xs">
                      <span className="font-medium">Grade C:</span> 86/160 (53.8%)
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-medium text-sm mb-1">Option AZ</div>
                    <div className="text-xs text-gray-600 mb-2">Papers 13 + 33</div>
                    <div className="text-xs">
                      <span className="font-medium">Grade C:</span> 92/160 (57.5%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Extended Combinations */}
              <div>
                <h4 className="font-semibold text-purple-900 mb-3">Extended Paper Options</h4>
                <div className="space-y-3">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="font-medium text-sm mb-1">Option BY</div>
                    <div className="text-xs text-gray-600 mb-2">Papers 22 + 42</div>
                    <div className="text-xs">
                      <span className="font-medium">Grade A*:</span> 176/200 (88.0%)
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="font-medium text-sm mb-1">Option BZ</div>
                    <div className="text-xs text-gray-600 mb-2">Papers 23 + 43</div>
                    <div className="text-xs">
                      <span className="font-medium">Grade A*:</span> 178/200 (89.0%)
                    </div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <div className="font-medium text-sm mb-1">Option BX</div>
                    <div className="text-xs text-gray-600 mb-2">Papers 21 + 41</div>
                    <div className="text-xs text-orange-800">
                      <span className="font-medium">Grade A*:</span> 156/200 (78.0%) - Outlier
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Why Grade Boundaries Vary</h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Different paper combinations assess slightly different content areas</li>
                <li>Some papers may be more challenging than others in a given session</li>
                <li>Cambridge adjusts boundaries to maintain consistent grade standards</li>
                <li>Statistical analysis ensures fair comparison across all options</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Key Takeaways */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Key Takeaways for Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">For Core Paper Students</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Target <strong>56%+</strong> for Grade C (highest possible)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Focus on consistent accuracy across all topics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Consider Extended paper if consistently scoring 70%+</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Master fundamentals thoroughly</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">For Extended Paper Students</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span>Aim for <strong>89%+</strong> for Grade A* (based on 2025 data)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span>Grade A achievable at <strong>77%+</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span>Strong foundation in Core topics essential</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span>Practice Extended-level problem-solving regularly</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-green-50 p-4 rounded-lg border-l-4 border-l-green-500">
              <div className="font-semibold text-green-900 mb-2">🎯 Success Strategy</div>
              <p className="text-sm text-green-800 leading-relaxed">
                Use our mastery-based learning system to track your progress across all difficulty levels. 
                Focus on building strong foundations (80%+ on easy questions) before attempting harder material. 
                The grade boundaries above represent minimum requirements - consistent performance above these 
                thresholds ensures exam success.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
