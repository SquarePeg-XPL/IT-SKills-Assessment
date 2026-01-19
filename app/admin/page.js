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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [rolesResult, skillsResult] = await Promise.all([
      supabase.from('roles').select('*').order('name'),
      supabase.from('skills').select('*').order('category, name')
    ]);

    if (rolesResult.data) setRoles(rolesResult.data);
    if (skillsResult.data) setSkills(skillsResult.data);
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

  // Role Form Component
  const RoleForm = ({ role, onSave, onCancel }) => {
    const [formData, setFormData] = useState(role || { name: '', description: '', department: '' });

    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role Name*</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Senior Product Manager"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Product, Engineering, Sales"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows="3"
            placeholder="Brief description of this role's responsibilities..."
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.name}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={16} />
            Save Role
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
                  {roles.map((role) => (
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
                          </div>
                          {role.description && (
                            <p className="text-sm text-gray-600">{role.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
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
                  ))}
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
      </div>
    </div>
  );
}
