'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Download, RotateCcw, CheckCircle } from 'lucide-react';

export default function SkillsAssessment() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentState, setAssessmentState] = useState({
    currentPhase: 'introduction',
    completedAreas: [],
    scores: {},
    started: false
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const skillsMatrix = {
    technical: [
      'Infrastructure & Systems',
      'Cloud Technologies',
      'Security & Compliance',
      'Development & Programming',
      'Database Management',
      'Networking',
      'IT Service Management',
      'Automation & Scripting'
    ],
    soft: [
      'Leadership',
      'Communication',
      'Problem Solving',
      'Collaboration',
      'Adaptability',
      'Critical Thinking'
    ]
  };

  const systemPrompt = `You are conducting a comprehensive IT skills assessment. Your goal is to evaluate the employee across technical and soft skill competencies on a 0-5 scale.

SKILLS TO ASSESS:
Technical: Infrastructure & Systems, Cloud Technologies, Security & Compliance, Development & Programming, Database Management, Networking, IT Service Management, Automation & Scripting
Soft Skills: Leadership, Communication, Problem Solving, Collaboration, Adaptability, Critical Thinking

ASSESSMENT APPROACH:
1. Start with a warm introduction and explain the process
2. Ask 2-3 targeted questions per competency area
3. Use follow-up questions to gauge depth of understanding
4. Be conversational but thorough
5. Mix technical and soft skill questions naturally
6. Look for real examples and practical application

SCORING CRITERIA (0-5):
0 = No knowledge/experience
1 = Basic awareness, limited application
2 = Working knowledge, can perform with guidance
3 = Proficient, can work independently
4 = Advanced, can mentor others
5 = Expert, strategic thinking and innovation

After completing all areas, provide a comprehensive JSON summary with scores and development recommendations.

RESPONSE FORMAT during assessment:
- Ask clear, specific questions
- Acknowledge responses thoughtfully
- Probe deeper when needed
- Keep track of what's been covered

FINAL RESPONSE FORMAT (after all questions):
Return ONLY valid JSON in this exact structure:
{
  "assessmentComplete": true,
  "scores": {
    "Infrastructure & Systems": 3,
    "Cloud Technologies": 2,
    ...all competencies...
  },
  "strengths": ["area1", "area2"],
  "developmentAreas": ["area1", "area2"],
  "recommendations": {
    "Infrastructure & Systems": "specific development advice",
    ...for each area...
  },
  "overallSummary": "2-3 sentence summary"
}`;

  const startAssessment = async () => {
    setAssessmentState({ ...assessmentState, started: true });
    setIsLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [
            { 
              role: "user", 
              content: `${systemPrompt}\n\nBegin the assessment by introducing yourself and explaining the process to the employee. Make them feel comfortable.`
            }
          ]
        })
      });

      const data = await response.json();
      const claudeResponse = data.content[0].text;
      
      setMessages([{
        role: 'assistant',
        content: claudeResponse
      }]);
    } catch (error) {
      console.error("Error starting assessment:", error);
      setMessages([{
        role: 'assistant',
        content: "I apologize, but I'm having trouble starting the assessment. Please try again."
      }]);
    }
    
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [
            { role: "user", content: systemPrompt },
            { role: "assistant", content: "I understand. I will conduct a comprehensive skills assessment across all technical and soft skill areas, asking thoughtful questions and providing a final JSON summary with scores and recommendations." },
            ...conversationHistory
          ]
        })
      });

      const data = await response.json();
      let claudeResponse = data.content[0].text;

      // Check if this is the final assessment JSON
      if (claudeResponse.includes('"assessmentComplete": true')) {
        try {
          // Strip any markdown formatting
          claudeResponse = claudeResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const assessmentResults = JSON.parse(claudeResponse);
          
          setAssessmentState(prev => ({
            ...prev,
            currentPhase: 'complete',
            scores: assessmentResults
          }));
        } catch (parseError) {
          console.error("Error parsing final results:", parseError);
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: claudeResponse
      }]);

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I apologize, but I encountered an error. Please try sending your response again."
      }]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetAssessment = () => {
    setMessages([]);
    setInput('');
    setAssessmentState({
      currentPhase: 'introduction',
      completedAreas: [],
      scores: {},
      started: false
    });
  };

  const exportResults = () => {
    if (assessmentState.currentPhase !== 'complete') return;

    const results = assessmentState.scores;
    const exportData = {
      assessmentDate: new Date().toISOString(),
      results: results,
      conversation: messages
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skills-assessment-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderResults = () => {
    if (assessmentState.currentPhase !== 'complete' || !assessmentState.scores.scores) return null;

    const results = assessmentState.scores;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CheckCircle className="text-green-500" size={28} />
            Assessment Complete
          </h2>
          <button
            onClick={exportResults}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={18} />
            Export Results
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-gray-700">{results.overallSummary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Technical Skills</h3>
            <div className="space-y-3">
              {Object.entries(results.scores)
                .filter(([key]) => skillsMatrix.technical.includes(key))
                .map(([skill, score]) => (
                  <div key={skill}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{skill}</span>
                      <span className="text-sm font-bold text-gray-900">{score}/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Soft Skills</h3>
            <div className="space-y-3">
              {Object.entries(results.scores)
                .filter(([key]) => skillsMatrix.soft.includes(key))
                .map(([skill, score]) => (
                  <div key={skill}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{skill}</span>
                      <span className="text-sm font-bold text-gray-900">{score}/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Key Strengths</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {results.strengths?.map((strength, idx) => (
                <li key={idx}>{strength}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Development Areas</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {results.developmentAreas?.map((area, idx) => (
                <li key={idx}>{area}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Development Recommendations</h3>
          <div className="space-y-3">
            {Object.entries(results.recommendations || {}).map(([skill, recommendation]) => (
              <div key={skill} className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-1">{skill}</h4>
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">IT Skills Assessment</h1>
            <p className="text-blue-100">Comprehensive evaluation of technical and soft skills</p>
          </div>

          {!assessmentState.started ? (
            <div className="p-8 text-center">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to Your Skills Assessment</h2>
                <p className="text-gray-600 mb-4">
                  This assessment will evaluate your capabilities across multiple technical and soft skill areas.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Technical Skills</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {skillsMatrix.technical.map((skill, idx) => (
                        <li key={idx}>• {skill}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Soft Skills</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {skillsMatrix.soft.map((skill, idx) => (
                        <li key={idx}>• {skill}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  The assessment typically takes 15-20 minutes. Answer thoughtfully and provide specific examples when possible.
                </p>
              </div>
              <button
                onClick={startAssessment}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Begin Assessment
              </button>
            </div>
          ) : (
            <>
              {renderResults()}
              
              <div className="h-96 overflow-y-auto p-6 bg-gray-50">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-block max-w-3xl p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-800 shadow'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="text-left mb-4">
                    <div className="inline-block bg-white p-4 rounded-lg shadow">
                      <div className="flex items-center gap-2">
                        <div className="animate-pulse">Thinking...</div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {assessmentState.currentPhase !== 'complete' && (
                <div className="p-4 bg-white border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your response..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <Send size={18} />
                      Send
                    </button>
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-100 border-t flex justify-between items-center">
                <button
                  onClick={resetAssessment}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <RotateCcw size={18} />
                  Start New Assessment
                </button>
                {assessmentState.currentPhase === 'complete' && (
                  <span className="text-green-600 font-semibold">Assessment Complete ✓</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}