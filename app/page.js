'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Download, RotateCcw, CheckCircle, MessageSquare, Award } from 'lucide-react';

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

  // Format message content for better readability
  const formatMessageContent = (content) => {
    // Strip markdown bold syntax
    let cleanContent = content.replace(/\*\*([^*]+)\*\*/g, '$1');
    
    // Split by double line breaks for paragraphs
    const paragraphs = cleanContent.split(/\n\n+/);
    
    return paragraphs.map((paragraph, idx) => {
      // Check if it's a bullet list
      if (paragraph.includes('\n•') || paragraph.match(/\n[-*]\s/)) {
        const lines = paragraph.split('\n').filter(line => line.trim());
        const title = lines[0] && !lines[0].match(/^[•\-*]\s/) ? lines.shift() : null;
        
        return (
          <div key={idx} className="mb-4">
            {title && <p className="font-semibold mb-2">{title}</p>}
            <ul className="space-y-2 ml-4">
              {lines.map((line, i) => {
                const text = line.replace(/^[•\-*]\s*/, '').trim();
                if (!text) return null;
                return (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1 flex-shrink-0">•</span>
                    <span className="flex-1">{text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }
      
      // Check if it's a numbered list
      if (paragraph.match(/^\d+\./m)) {
        const lines = paragraph.split('\n').filter(line => line.trim());
        const title = lines[0] && !lines[0].match(/^\d+\./) ? lines.shift() : null;
        
        return (
          <div key={idx} className="mb-4">
            {title && <p className="font-semibold mb-2">{title}</p>}
            <ol className="space-y-2 ml-6 list-decimal">
              {lines.map((line, i) => {
                const text = line.replace(/^\d+\.\s*/, '').trim();
                if (!text) return null;
                return <li key={i} className="ml-2">{text}</li>;
              })}
            </ol>
          </div>
        );
      }
      
      // Regular paragraph - check if it should be bold (starts/ends with **)
      if (paragraph.trim()) {
        const isBold = paragraph.match(/^\*\*.*\*\*$/);
        const text = paragraph.replace(/^\*\*|\*\*$/g, '').trim();
        
        return (
          <p key={idx} className={`mb-4 leading-relaxed ${isBold ? 'font-semibold' : ''}`}>
            {text}
          </p>
        );
      }
      
      return null;
    }).filter(Boolean);
  };

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
      const response = await fetch("/api/chat", {
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

      const response = await fetch("/api/chat", {
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
    if (!assessmentState.scores.assessmentComplete) return;
    
    const results = assessmentState.scores;
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `skills-assessment-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const renderResults = () => {
    if (assessmentState.currentPhase !== 'complete' || !assessmentState.scores.assessmentComplete) {
      return null;
    }

    const results = assessmentState.scores;

    return (
      <div className="p-6 bg-gradient-to-br from-green-50 to-blue-50 border-b border-green-200 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 rounded-full">
              <Award className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Assessment Complete!</h2>
              <p className="text-gray-600">Your comprehensive skills evaluation is ready</p>
            </div>
          </div>
          <button
            onClick={exportResults}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
          >
            <Download size={18} />
            Export Results
          </button>
        </div>

        <div className="mb-6 p-6 bg-white rounded-xl shadow-md">
          <p className="text-gray-700 leading-relaxed">{results.overallSummary}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded"></div>
              Technical Skills
            </h3>
            <div className="space-y-4">
              {Object.entries(results.scores)
                .filter(([key]) => skillsMatrix.technical.includes(key))
                .map(([skill, score]) => (
                  <div key={skill} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">{skill}</span>
                      <span className="text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{score}/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-green-500 rounded"></div>
              Soft Skills
            </h3>
            <div className="space-y-4">
              {Object.entries(results.scores)
                .filter(([key]) => skillsMatrix.soft.includes(key))
                .map(([skill, score]) => (
                  <div key={skill} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-green-600 transition-colors">{skill}</span>
                      <span className="text-sm font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">{score}/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md border border-green-200">
            <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              Key Strengths
            </h3>
            <ul className="space-y-2">
              {results.strengths?.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-green-600 mt-1">●</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-md border border-orange-200">
            <h3 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
              <MessageSquare size={20} className="text-orange-600" />
              Development Areas
            </h3>
            <ul className="space-y-2">
              {results.developmentAreas?.map((area, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-orange-600 mt-1">●</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Development Recommendations</h3>
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(results.recommendations || {}).map(([skill, recommendation]) => (
              <div key={skill} className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:shadow-md transition-all">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  {skill}
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: .8; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.6s ease-out;
        }
        
        .gradient-border {
          position: relative;
          background: linear-gradient(white, white) padding-box,
                      linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899) border-box;
          border: 2px solid transparent;
        }
        
        .message-shadow {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.06),
                      0 0 0 1px rgba(0, 0, 0, 0.05);
        }
        
        .message-shadow:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
                      0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
        
        .skill-bar {
          background: linear-gradient(
            90deg,
            rgba(59, 130, 246, 0.1) 0%,
            rgba(59, 130, 246, 0.05) 100%
          );
          animation: shimmer 3s infinite;
          background-size: 1000px 100%;
        }
        
        .input-focus:focus {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          border-color: #3b82f6;
        }
        
        .btn-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.5);
        }
        
        .card-hover:hover {
          transform: translateY(-4px) scale(1.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #2563eb, #7c3aed);
        }
      `}</style>
      
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Award size={36} />
                IT Skills Assessment
              </h1>
              <p className="text-blue-100 text-lg">Comprehensive evaluation of technical and soft skills</p>
            </div>
          </div>

          {!assessmentState.started ? (
            <div className="p-12 text-center">
              <div className="mb-8 animate-fadeIn">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Your Skills Assessment</h2>
                <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
                  This comprehensive assessment will evaluate your capabilities across multiple technical and soft skill areas to help identify your strengths and development opportunities.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-8 max-w-4xl mx-auto">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md border border-blue-200 hover:shadow-lg transition-all card-hover">
                    <h3 className="font-bold text-blue-900 mb-3 text-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      Technical Skills
                    </h3>
                    <ul className="text-sm text-gray-700 space-y-2">
                      {skillsMatrix.technical.map((skill, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-blue-600 flex-shrink-0" />
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md border border-green-200 hover:shadow-lg transition-all card-hover">
                    <h3 className="font-bold text-green-900 mb-3 text-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                      Soft Skills
                    </h3>
                    <ul className="text-sm text-gray-700 space-y-2">
                      {skillsMatrix.soft.map((skill, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg mb-8 max-w-2xl mx-auto">
                  <p className="text-gray-700">
                    <span className="font-semibold">Duration:</span> 15-20 minutes • 
                    <span className="font-semibold ml-2">Format:</span> Conversational assessment • 
                    <span className="font-semibold ml-2">Result:</span> Detailed skills report
                  </p>
                </div>
              </div>
              <button
                onClick={startAssessment}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl btn-hover"
              >
                Begin Assessment
              </button>
            </div>
          ) : (
            <>
              {renderResults()}
              
              <div className="h-[500px] overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white custom-scrollbar">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 animate-slideIn ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-block max-w-3xl p-5 rounded-2xl message-shadow ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-100'
                      }`}
                    >
                      <div className={message.role === 'assistant' ? 'prose prose-sm max-w-none' : ''}>
                        {formatMessageContent(message.content)}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="text-left mb-4 animate-fadeIn">
                    <div className="inline-block bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                        <span className="text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {assessmentState.currentPhase !== 'complete' && (
                <div className="p-6 bg-white border-t border-gray-200">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your response..."
                      className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none input-focus transition-all"
                      disabled={isLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md btn-hover flex items-center gap-2"
                    >
                      <Send size={20} />
                      Send
                    </button>
                  </div>
                </div>
              )}

              <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200 flex justify-between items-center">
                <button
                  onClick={resetAssessment}
                  className="flex items-center gap-2 px-5 py-2 text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                >
                  <RotateCcw size={18} />
                  Start New Assessment
                </button>
                {assessmentState.currentPhase === 'complete' && (
                  <div className="flex items-center gap-2 text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-lg">
                    <CheckCircle size={20} />
                    Assessment Complete
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}