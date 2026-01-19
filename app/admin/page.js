'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Save, X, Briefcase, Award } from 'lucide-react';

export default function AdminDashboard() {
  const [roles, setRoles] = useState([]);
  const [skills, setSkills] = useState([]);
  const [activeTab, setActiveTab] = useState('roles');
  const [editingRole, setEditingRole] = useState(null);
  const [editingSkill, setEditingSkill] = useState(null);
  const [managingSkillsForRole, setManagingSkillsForRole] = useState(null);
  const [roleSkills, setRoleSkills] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [rolesResult, skillsResult, roleSkillsResult] = await Promise.all([
      supabase.from('roles').select('*').order('name'),
      supabase.from('skills').select('*').order('category, name'),
      supabase.from('role_skills').select('role_id, skill_id, skills(id, name, category)')
    ]);

    if (rolesResult.data) setRoles(rolesResult.data);
    if (skillsResult.data) setSkills(skillsResult.data);
    
    // Organize role_skills by role_id
    if (roleSkillsResult.data) {
      const organized = {};
      roleSkillsResult.data.forEach(rs => {
        if (!organized[rs.role_id]) organized[rs.role_id] = [];
        organized[rs.role_id].push(rs.skills);
      });
      setRoleSkills(organized);
    }
    
    setLoading(false);
  };

  // Role Management
  const saveRole = async (role) => {
    if (role.id) {
      await supabase.from('roles').update(role).eq('id', role.id);
    } else {
      await supabase.from('roles').insert([role]);
    }
    setEditingRole(null);
    fetchData();
  };

  const deleteRole = async (id) => {
    if (confirm('Delete this role? This will remove all associated skill assignments.')) {
      await supabase.from('roles').delete().eq('id', id);
      fetchData();
    }
  };

  // Skill Management
  const saveSkill = async (skill) => {
    if (skill.id) {
      await supabase.from('skills').update(skill).eq('id', skill.id);
    } else {
      await supabase.from('skills').insert([skill]);
    }
    setEditingSkill(null);
    fetchData();
  };

  const deleteSkill = async (id) => {
    if (confirm('Delete this skill? This will remove it from all roles.')) {
      await supabase.from('skills').delete().eq('id', id);
      fetchData();
    }
  };

  // Skill Assignment Management
  const toggleSkillForRole = async (roleId, skillId, currentlyAssigned) => {
    if (currentlyAssigned) {
      // Remove skill from role
      await supabase.from('role_skills')
        .delete()
        .eq('role_id', roleId)
        .eq('skill_id', skillId);
    } else {
      // Add skill to role
      await supabase.from('role_skills')
        .insert([{ role_id: roleId, skill_id: skillId, is_required: true }]);
    }
    fetchData();
  };

  const addSkillToAllRoles = async (skillId) => {
    if (!confirm('Add this skill to ALL roles?')) return;
    
    const inserts = roles.map(role => ({
      role_id: role.id,
      skill_id: skillId,
      is_required: true
    }));
    
    // Use upsert to avoid duplicates
    await supabase.from('role_skills').upsert(inserts, { 
      onConflict: 'role_id,skill_id',
      ignoreDuplicates: true 
    });
    
    fetchData();
  };

  const isSkillAssigned = (roleId, skillId) => {
    return roleSkills[roleId]?.some(s => s.id === skillId) || false;
  };

  // Role Form Component with AI suggestions
  const RoleForm = ({ role, onSave, onCancel }) => {
    const [formData, setFormData] = useState(role || { name: '', description: '', department: '' });
    const [suggestedSkills, setSuggestedSkills] = useState([]);
    const [suggestedDescription, setSuggestedDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const departments = [
      'Sales',
      'Marketing',
      'Engineering',
      'Product',
      'Customer Success',
      'Operations',
      'Finance',
      'Human Resources',
      'Information Technology',
      'Legal',
      'Other'
    ];

    const generateSuggestions = async () => {
      if (!formData.name || !formData.name.trim()) return;
      
      setIsGenerating(true);
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            messages: [{
              role: 'user',
              content: `For the job role "${formData.name}", provide:
1. A concise 1-2 sentence description of this role's core responsibilities
2. 8-12 relevant skills (mix of technical and soft skills) that should be assessed for this role

Respond ONLY in this JSON format:
{
  "description": "1-2 sentence description",
  "skills": [
    {"name": "Skill Name", "category": "technical", "description": "brief description"},
    {"name": "Skill Name", "category": "soft", "description": "brief description"}
  ]
}`
            }]
          })
        });

        const data = await response.json();
        const content = data.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0]);
          setSuggestedDescription(suggestions.description);
          setSuggestedSkills(suggestions.skills);
        }
      } catch (error) {
        console.error('Error generating suggestions:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    const applyDescription = () => {
      setFormData({ ...formData, description: suggestedDescription });
    };

    const createAndAssignSkill = async (skillData) => {
      // Check if skill already exists
      const existing = skills.find(s => 
        s.name.toLowerCase() === skillData.name.toLowerCase()
      );
      
      if (existing) {
        // Skill exists, just mark it for assignment
        return existing.id;
      } else {
        // Create new skill
        const { data, error } = await supabase
          .from('skills')
          .insert([skillData])
          .select()
          .single();
        
        if (data) {
          return data.id;
        }
      }
      return null;
    };

    const saveWithSkills = async () => {
      // First save the role
      let savedRoleId = formData.id;
      
      if (formData.id) {
        await supabase.from('roles').update(formData).eq('id', formData.id);
      } else {
        const { data } = await supabase.from('roles').insert([formData]).select().single();
        savedRoleId = data?.id;
      }

      // Then assign selected skills
      if (savedRoleId && suggestedSkills.length > 0) {
        const selectedSkills = suggestedSkills.filter(s => s.selected);
        
        for (const skill of selectedSkills) {
          const skillId = await createAndAssignSkill({
            name: skill.name,
            category: skill.category,
            description: skill.description
          });
          
          if (skillId) {
            await supabase.from('role_skills').upsert([{
              role_id: savedRoleId,
              skill_id: skillId,
              is_required: true
            }], {
              onConflict: 'role_id,skill_id',
              ignoreDuplicates: true
            });
          }
        }
      }

      onSave(formData);
    };

    const toggleSkillSelection = (index) => {
      const updated = [...suggestedSkills];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      setSuggestedSkills(updated);
    };

    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role Name*</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Senior Product Manager"
              />
              <button
                onClick={generateSuggestions}
                disabled={!formData.name || !formData.name.trim() || isGenerating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
              >
                {isGenerating ? 'Generating...' : '✨ Suggest'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select department...</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            {suggestedDescription && (
              <button
                onClick={applyDescription}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Use suggested description
              </button>
            )}
          </div>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows="3"
            placeholder="Brief description of this role's responsibilities..."
          />
          {suggestedDescription && !formData.description && (
            <p className="mt-2 text-sm text-gray-600 italic bg-indigo-50 p-3 rounded-lg">
              💡 Suggested: {suggestedDescription}
            </p>
          )}
        </div>

        {/* Suggested Skills */}
        {suggestedSkills.length > 0 && (
          <div className="mb-4 p-4 bg-white rounded-lg border border-indigo-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Suggested Skills (select which to assign)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestedSkills.map((skill, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={skill.selected || false}
                    onChange={() => toggleSkillSelection(idx)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        skill.category === 'technical' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {skill.category}
                      </span>
                    </div>
                    {skill.description && (
                      <p className="text-xs text-gray-600 mt-0.5">{skill.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={saveWithSkills}
            disabled={!formData.name}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={16} />
            Save Role {suggestedSkills.filter(s => s.selected).length > 0 && `& Assign ${suggestedSkills.filter(s => s.selected).length} Skills`}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <X size={16} />
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Skill Form Component
  const SkillForm = ({ skill, onSave, onCancel }) => {
    const [formData, setFormData] = useState(skill || { name: '', category: 'technical', description: '' });

    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skill Name*</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Data Analysis"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category*</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="technical">Technical</option>
              <option value="soft">Soft Skill</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows="2"
            placeholder="What does proficiency in this skill entail?"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.name}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={16} />
            Save Skill
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <X size={16} />
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Manage Skills Modal
  const ManageSkillsModal = ({ role, onClose }) => {
    const assignedSkills = roleSkills[role.id] || [];
    const technicalSkills = skills.filter(s => s.category === 'technical');
    const softSkills = skills.filter(s => s.category === 'soft');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Manage Skills</h3>
                <p className="text-sm text-gray-600 mt-1">{role.name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Technical Skills</h4>
              <div className="space-y-2">
                {technicalSkills.map(skill => {
                  const assigned = isSkillAssigned(role.id, skill.id);
                  return (
                    <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{skill.name}</p>
                        {skill.description && (
                          <p className="text-xs text-gray-600 mt-1">{skill.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleSkillForRole(role.id, skill.id, assigned)}
                        className={`ml-4 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          assigned 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {assigned ? 'Assigned' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Soft Skills</h4>
              <div className="space-y-2">
                {softSkills.map(skill => {
                  const assigned = isSkillAssigned(role.id, skill.id);
                  return (
                    <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{skill.name}</p>
                        {skill.description && (
                          <p className="text-xs text-gray-600 mt-1">{skill.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleSkillForRole(role.id, skill.id, assigned)}
                        className={`ml-4 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          assigned 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {assigned ? 'Assigned' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{assignedSkills.length} skill{assignedSkills.length !== 1 ? 's' : ''} assigned</span>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage roles, skills, and assessment configurations</p>
            </div>
            <a
              href="/assess"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              Go to Assessment →
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('roles')}
                className={`px-8 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'roles'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Briefcase size={18} />
                  Roles ({roles.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('skills')}
                className={`px-8 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'skills'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Award size={18} />
                  Skills ({skills.length})
                </div>
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'roles' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Roles</h2>
                  <button
                    onClick={() => setEditingRole({})}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium"
                  >
                    <Plus size={18} />
                    New Role
                  </button>
                </div>

                {editingRole && (
                  <RoleForm
                    role={editingRole}
                    onSave={saveRole}
                    onCancel={() => setEditingRole(null)}
                  />
                )}

                <div className="space-y-3">
                  {roles.map((role) => {
                    const assignedCount = roleSkills[role.id]?.length || 0;
                    return (
                      <div key={role.id} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{role.name}</h3>
                              {role.department && (
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                                  {role.department}
                                </span>
                              )}
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                {assignedCount} skill{assignedCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {role.description && (
                              <p className="text-sm text-gray-600">{role.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => setManagingSkillsForRole(role)}
                              className="px-3 py-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
                            >
                              Manage Skills
                            </button>
                            <button
                              onClick={() => setEditingRole(role)}
                              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteRole(role.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {roles.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No roles yet. Create your first role to get started.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Skills Library</h2>
                  <button
                    onClick={() => setEditingSkill({})}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium"
                  >
                    <Plus size={18} />
                    New Skill
                  </button>
                </div>

                {editingSkill && (
                  <SkillForm
                    skill={editingSkill}
                    onSave={saveSkill}
                    onCancel={() => setEditingSkill(null)}
                  />
                )}

                {/* Technical Skills */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Skills</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {skills.filter(s => s.category === 'technical').map((skill) => (
                      <div key={skill.id} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{skill.name}</h4>
                            {skill.description && (
                              <p className="text-xs text-gray-600">{skill.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => addSkillToAllRoles(skill.id)}
                              className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"
                              title="Add to all roles"
                            >
                              <Plus size={14} />
                            </button>
                            <button
                              onClick={() => setEditingSkill(skill)}
                              className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteSkill(skill.id)}
                              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {skills.filter(s => s.category === 'technical').length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No technical skills yet.
                    </div>
                  )}
                </div>

                {/* Soft Skills */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Soft Skills</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {skills.filter(s => s.category === 'soft').map((skill) => (
                      <div key={skill.id} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{skill.name}</h4>
                            {skill.description && (
                              <p className="text-xs text-gray-600">{skill.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => addSkillToAllRoles(skill.id)}
                              className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"
                              title="Add to all roles"
                            >
                              <Plus size={14} />
                            </button>
                            <button
                              onClick={() => setEditingSkill(skill)}
                              className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteSkill(skill.id)}
                              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {skills.filter(s => s.category === 'soft').length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No soft skills yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manage Skills Modal */}
        {managingSkillsForRole && (
          <ManageSkillsModal 
            role={managingSkillsForRole} 
            onClose={() => setManagingSkillsForRole(null)} 
          />
        )}
      </div>
    </div>
  );
}