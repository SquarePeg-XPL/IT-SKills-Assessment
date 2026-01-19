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
    // Strip markdown syntax
    let cleanContent = content
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold **text**
      .replace(/^#{1,6}\s+/gm, '')        // Remove headers ##
      .replace(/\*([^*]+)\*/g, '$1');     // Remove italic *text*
    
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
            <ul className="space-y-2">
              {lines.map((line, i) => {
                const text = line.replace(/^[•\-*]\s*/, '').trim();
                if (!text) return null;
                return (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
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
            <ol className="space-y-2 list-decimal pl-6">
              {lines.map((line, i) => {
                const text = line.replace(/^\d+\.\s*/, '').trim();
                if (!text) return null;
                return <li key={i} className="text-gray-700">{text}</li>;
              })}
            </ol>
          </div>
        );
      }
      
      // Regular paragraph - check if it should be bold
      if (paragraph.trim()) {
        const isBold = paragraph.match(/^\*\*.*\*\*$/);
        const text = paragraph.replace(/^\*\*|\*\*$/g, '').trim();
        
        return (
          <p key={idx} className={`mb-4 leading-relaxed ${isBold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
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

      // Check if this is the final assessment JSON - look for the JSON structure
      if (claudeResponse.includes('"assessmentComplete": true') || claudeResponse.includes('assessmentComplete')) {
        try {
          // Extract JSON from response (may be wrapped in markdown or have preamble text)
          let jsonText = claudeResponse;
          
          // Remove markdown code blocks if present
          jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
          
          // Try to extract just the JSON object if there's other text
          const jsonMatch = jsonText.match(/\{[\s\S]*"assessmentComplete"[\s\S]*\}/);
          if (jsonMatch) {
            jsonText = jsonMatch[0];
          }
          
          const assessmentResults = JSON.parse(jsonText);
          
          // Only proceed if we successfully parsed and it has the complete flag
          if (assessmentResults.assessmentComplete) {
            setAssessmentState(prev => ({
              ...prev,
              currentPhase: 'complete',
              scores: assessmentResults
            }));
            
            // Don't add the JSON to messages - just show a completion message
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: "✓ Assessment complete! Here are your detailed results:"
            }]);
            
            return; // Exit early, don't add JSON to messages
          }
        } catch (parseError) {
          console.error("Error parsing final results:", parseError);
          // Fall through to add the message normally if parsing fails
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
      <div className="p-6 bg-white rounded-3xl shadow-lg border border-gray-100 animate-fadeIn">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-md">
              <Award className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Assessment Complete!</h2>
              <p className="text-gray-500 mt-1">Your comprehensive skills evaluation</p>
            </div>
          </div>
          <button
            onClick={exportResults}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm hover:shadow-md border border-gray-200"
          >
            <Download size={18} />
            <span className="font-medium">Export Results</span>
          </button>
        </div>

        <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
          <p className="text-gray-700 leading-relaxed text-lg">{results.overallSummary}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
              <h3 className="text-2xl font-bold text-gray-900">Technical Skills</h3>
            </div>
            <div className="space-y-5">
              {Object.entries(results.scores)
                .filter(([key]) => skillsMatrix.technical.includes(key))
                .map(([skill, score]) => (
                  <div key={skill} className="group">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">{skill}</span>
                      <span className="text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">{score}/5</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-8 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
              <h3 className="text-2xl font-bold text-gray-900">Soft Skills</h3>
            </div>
            <div className="space-y-5">
              {Object.entries(results.scores)
                .filter(([key]) => skillsMatrix.soft.includes(key))
                .map(([skill, score]) => (
                  <div key={skill} className="group">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-600 transition-colors">{skill}</span>
                      <span className="text-sm font-bold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg">{score}/5</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-sm border border-emerald-100">
            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <CheckCircle size={24} className="text-emerald-600" />
              Key Strengths
            </h3>
            <ul className="space-y-3">
              {results.strengths?.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-700">
                  <span className="text-emerald-500 mt-1 text-lg">●</span>
                  <span className="leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-sm border border-amber-100">
            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <MessageSquare size={24} className="text-amber-600" />
              Development Areas
            </h3>
            <ul className="space-y-3">
              {results.developmentAreas?.map((area, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-700">
                  <span className="text-amber-500 mt-1 text-lg">●</span>
                  <span className="leading-relaxed">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Development Recommendations</h3>
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(results.recommendations || {}).map(([skill, recommendation]) => (
              <div key={skill} className="p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  {skill}
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed pl-4">{recommendation}</p>
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
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/10 to-indigo-500/20"></div>
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
              <div className="mb-10 animate-fadeIn">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
                  <Award className="text-white" size={40} />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Your Skills Assessment</h2>
                <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
                  A comprehensive evaluation of your technical and soft skills to identify strengths and growth opportunities.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-10 max-w-5xl mx-auto">
                  <div className="group p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                        <div className="w-3 h-3 bg-blue-600 rounded-full group-hover:bg-white"></div>
                      </div>
                      <h3 className="font-bold text-gray-900 text-xl">Technical Skills</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                      {skillsMatrix.technical.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle size={14} className="text-blue-500 flex-shrink-0" />
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="group p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                        <div className="w-3 h-3 bg-emerald-600 rounded-full group-hover:bg-white"></div>
                      </div>
                      <h3 className="font-bold text-gray-900 text-xl">Soft Skills</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                      {skillsMatrix.soft.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-2xl mb-10 max-w-2xl mx-auto">
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-semibold text-gray-900">Duration:</span> 15-20 minutes</p>
                    <p><span className="font-semibold text-gray-900">Format:</span> Conversational assessment</p>
                    <p><span className="font-semibold text-gray-900">Result:</span> Detailed skills report</p>
                  </div>
                </div>
              </div>
              <button
                onClick={startAssessment}
                className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="relative z-10">Begin Assessment</span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity"></div>
              </button>
            </div>
          ) : (
            <>
              <div className="h-[600px] overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-6 animate-fadeIn ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-block max-w-3xl p-6 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md'
                          : 'bg-white text-gray-800 shadow-sm border border-gray-100'
                      }`}
                    >
                      <div className={message.role === 'assistant' ? 'prose prose-sm max-w-none text-gray-700 leading-relaxed' : 'text-white leading-relaxed'}>
                        {formatMessageContent(message.content)}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="text-left mb-6 animate-fadeIn">
                    <div className="inline-block bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                        <span className="text-gray-500 text-sm">Analyzing your response...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show results inline at bottom of conversation */}
                {assessmentState.currentPhase === 'complete' && assessmentState.scores.assessmentComplete && (
                  <div className="mb-4 animate-fadeIn">
                    {renderResults()}
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {assessmentState.currentPhase !== 'complete' && (
                <div className="p-6 bg-white border-t border-gray-100">
                  <div className="flex gap-4 items-end">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your response... (Shift+Enter for new line, Enter to send)"
                      className="flex-1 px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none overflow-auto text-gray-900 placeholder-gray-400"
                      style={{
                        minHeight: '120px',
                        maxHeight: '300px',
                        height: input ? `${Math.min(300, Math.max(120, input.split('\n').length * 24 + 36))}px` : '120px'
                      }}
                      rows={1}
                      disabled={isLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2 h-[60px]"
                    >
                      <Send size={20} />
                      Send
                    </button>
                  </div>
                </div>
              )}

              <div className="p-5 bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-100 flex justify-between items-center">
                <button
                  onClick={resetAssessment}
                  className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200"
                >
                  <RotateCcw size={18} />
                  <span className="font-medium">Start New Assessment</span>
                </button>
                {assessmentState.currentPhase === 'complete' && (
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200">
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