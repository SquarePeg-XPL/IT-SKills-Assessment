'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Download, RotateCcw, CheckCircle2, TrendingUp, Award, Sparkles } from 'lucide-react';

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
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*([^*]+)\*/g, '$1');
    
    const paragraphs = cleanContent.split(/\n\n+/);
    
    return paragraphs.map((paragraph, idx) => {
      if (paragraph.includes('\n•') || paragraph.match(/\n[-*]\s/)) {
        const lines = paragraph.split('\n').filter(line => line.trim());
        const title = lines[0] && !lines[0].match(/^[•\-*]\s/) ? lines.shift() : null;
        
        return (
          <div key={idx} className="mb-3">
            {title && <p className="font-medium mb-2 text-gray-900">{title}</p>}
            <ul className="space-y-1.5">
              {lines.map((line, i) => {
                const text = line.replace(/^[•\-*]\s*/, '').trim();
                if (!text) return null;
                return (
                  <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }
      
      if (paragraph.match(/^\d+\./m)) {
        const lines = paragraph.split('\n').filter(line => line.trim());
        const title = lines[0] && !lines[0].match(/^\d+\./) ? lines.shift() : null;
        
        return (
          <div key={idx} className="mb-3">
            {title && <p className="font-medium mb-2 text-gray-900">{title}</p>}
            <ol className="space-y-1.5 list-decimal pl-5">
              {lines.map((line, i) => {
                const text = line.replace(/^\d+\.\s*/, '').trim();
                if (!text) return null;
                return <li key={i} className="text-gray-600 text-sm">{text}</li>;
              })}
            </ol>
          </div>
        );
      }
      
      if (paragraph.trim()) {
        return (
          <p key={idx} className="mb-3 text-gray-600 text-sm leading-relaxed">
            {paragraph.trim()}
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
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }]);

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
      if (claudeResponse.includes('"assessmentComplete": true') || claudeResponse.includes('assessmentComplete')) {
        try {
          let jsonText = claudeResponse;
          
          jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
          
          const jsonMatch = jsonText.match(/\{[\s\S]*"assessmentComplete"[\s\S]*\}/);
          if (jsonMatch) {
            jsonText = jsonMatch[0];
          }
          
          const assessmentResults = JSON.parse(jsonText);
          
          if (assessmentResults.assessmentComplete) {
            setAssessmentState(prev => ({
              ...prev,
              currentPhase: 'complete',
              scores: assessmentResults
            }));
            
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: "✓ Assessment complete! Here are your detailed results:"
            }]);
            
            return;
          }
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
    } finally {
      setIsLoading(false);
    }
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
    
    const getScoreColor = (score) => {
      if (score >= 4) return 'emerald';
      if (score >= 3) return 'blue';
      if (score >= 2) return 'amber';
      return 'slate';
    };

    return (
      <div className="mb-6 animate-fadeIn">
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Sparkles className="text-white" size={28} strokeWidth={2} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-1">Assessment Complete</h2>
                  <p className="text-gray-500 text-sm">Your comprehensive skills evaluation</p>
                </div>
              </div>
              <button
                onClick={exportResults}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <Download size={16} strokeWidth={2} />
                Export
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-1 h-20 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full mt-1"></div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Executive Summary</h3>
                <p className="text-gray-600 leading-relaxed">{results.overallSummary}</p>
              </div>
            </div>
          </div>

          {/* Scores Grid */}
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Technical Skills */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Technical Skills</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(results.scores)
                  .filter(([key]) => skillsMatrix.technical.includes(key))
                  .map(([skill, score]) => {
                    const color = getScoreColor(score);
                    return (
                      <div key={skill} className="group">
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-sm font-medium text-gray-700">{skill}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-semibold text-gray-900">{score}</span>
                            <span className="text-xs text-gray-400">/5</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              color === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                              color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                              color === 'amber' ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                              'bg-gradient-to-r from-slate-400 to-slate-500'
                            }`}
                            style={{ width: `${(score / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Soft Skills */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-violet-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Soft Skills</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(results.scores)
                  .filter(([key]) => skillsMatrix.soft.includes(key))
                  .map(([skill, score]) => {
                    const color = getScoreColor(score);
                    return (
                      <div key={skill} className="group">
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-sm font-medium text-gray-700">{skill}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-semibold text-gray-900">{score}</span>
                            <span className="text-xs text-gray-400">/5</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              color === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                              color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                              color === 'amber' ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                              'bg-gradient-to-r from-slate-400 to-slate-500'
                            }`}
                            style={{ width: `${(score / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Insights Grid */}
          <div className="p-8 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} className="text-emerald-600" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Key Strengths</h3>
              </div>
              <ul className="space-y-2.5">
                {results.strengths?.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
                    <span className="leading-relaxed">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Development Areas */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <Award size={20} className="text-blue-600" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Growth Opportunities</h3>
              </div>
              <ul className="space-y-2.5">
                {results.developmentAreas?.map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-400 flex-shrink-0 mt-0.5"></div>
                    <span className="leading-relaxed">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-8 pt-0">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-900">Personalized Recommendations</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(results.recommendations || {}).map(([skill, recommendation]) => (
                <div key={skill} className="group p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-200/50 hover:border-gray-300/50 rounded-xl transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">{skill}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="relative px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-white via-gray-50/50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Award size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Skills Assessment</h1>
                <p className="text-sm text-gray-500">Comprehensive technical and soft skills evaluation</p>
              </div>
            </div>
          </div>

          {!assessmentState.started ? (
            <div className="p-12">
              <div className="max-w-4xl mx-auto text-center">
                {/* Welcome Content */}
                <div className="mb-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl mb-6 shadow-xl shadow-indigo-500/20">
                    <Sparkles className="text-white" size={32} strokeWidth={2} />
                  </div>
                  <h2 className="text-3xl font-semibold text-gray-900 mb-3">Welcome</h2>
                  <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                    A comprehensive evaluation to identify your strengths and unlock growth opportunities
                  </p>
                </div>

                {/* Skills Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  <div className="group p-6 bg-white border border-gray-200/80 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full group-hover:bg-white transition-colors"></div>
                      </div>
                      <h3 className="font-semibold text-gray-900">Technical Skills</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left text-sm text-gray-600">
                      {skillsMatrix.technical.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="group p-6 bg-white border border-gray-200/80 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center group-hover:bg-violet-500 transition-colors">
                        <div className="w-2 h-2 bg-violet-600 rounded-full group-hover:bg-white transition-colors"></div>
                      </div>
                      <h3 className="font-semibold text-gray-900">Soft Skills</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left text-sm text-gray-600">
                      {skillsMatrix.soft.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Info Bar */}
                <div className="inline-flex items-center gap-6 p-4 bg-gray-50 border border-gray-200/50 rounded-xl mb-10 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    <span><span className="font-medium text-gray-900">15-20 min</span> duration</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    <span><span className="font-medium text-gray-900">Conversational</span> format</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    <span><span className="font-medium text-gray-900">Detailed</span> report</span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={startAssessment}
                  className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-95"
                >
                  <span>Begin Assessment</span>
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Area */}
              <div className="h-[600px] overflow-y-auto px-8 py-6 bg-gradient-to-b from-white to-gray-50/30">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-6 animate-fadeIn ${
                      message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-3xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white px-5 py-4 rounded-2xl rounded-tr-md shadow-md shadow-indigo-500/10'
                          : 'bg-white border border-gray-200/80 text-gray-700 px-5 py-4 rounded-2xl rounded-tl-md shadow-sm'
                      }`}
                    >
                      <div className={message.role === 'assistant' ? 'text-sm' : 'text-sm'}>
                        {formatMessageContent(message.content)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start mb-6 animate-fadeIn">
                    <div className="bg-white border border-gray-200/80 px-5 py-4 rounded-2xl rounded-tl-md shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                        <span className="text-sm text-gray-400">Analyzing...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show results inline */}
                {assessmentState.currentPhase === 'complete' && assessmentState.scores.assessmentComplete && renderResults()}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              {assessmentState.currentPhase !== 'complete' && (
                <div className="px-8 py-6 border-t border-gray-100 bg-white">
                  <div className="flex gap-3 items-end">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your response... (Shift+Enter for new line)"
                      className="flex-1 px-4 py-3.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none bg-white placeholder-gray-400"
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
                      className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center gap-2 h-[56px]"
                    >
                      <Send size={18} strokeWidth={2} />
                      <span className="text-sm">Send</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <button
                  onClick={resetAssessment}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200"
                >
                  <RotateCcw size={16} strokeWidth={2} />
                  New Assessment
                </button>
                {assessmentState.currentPhase === 'complete' && (
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200/50">
                    <CheckCircle2 size={16} strokeWidth={2.5} />
                    Complete
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