import axios from 'axios';
import React, { useState, useEffect, useContext } from 'react';
import { Edit, X, Trash2, Copy } from 'lucide-react';
import { indiaStatesAndCities } from "./Ad_Pos";
import CityMultiSelect from "../components/CityMultiSelect";
import { EXPERIENCE_RANGES } from "./Ad_Pos";
import ExperienceRange from "../components/ExperienceRange";
import { UserStateContext } from '../context/AuthPro';

const Input = ({ label, ...props }) => (
  <div className="flex flex-col">
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">{label}</label>
    <input
      {...props}
      className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 bg-white disabled:bg-gray-100 disabled:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
    />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div className="col-span-1 sm:col-span-2">
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 block">{label}</label>
    <textarea
      {...props}
      rows={3}
      className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
    />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div className="flex flex-col">
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">{label}</label>
    <select
      {...props}
      className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
    >
      <option value="">Select</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const MultiSelect = ({ label, options, value, onChange }) => (
  <div className="flex flex-col">
    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">{label}</label>
    <select
      multiple
      value={value}
      onChange={(e) => onChange(Array.from(e.target.selectedOptions, o => o.value))}
      className="h-24 sm:h-32 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

// Edit Modal Component with Responsive Design
const EditJobModal = ({ job, onClose, onUpdate }) => {
  const { user } = useContext(UserStateContext);
  const [submit, setSubmit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [skillCategories, setSkillCategories] = useState([]);
  const [skillCatsLoading, setSkillCatsLoading] = useState(false);
  const [form, setForm] = useState({
    id: job?.id,
    pos_id: job?.pos_id || "",
    position: job?.position || "",
    hr_name: job?.hr_name || "",
    state: job?.state || [],
    client: job?.client || "",
    clientspoc: job?.clientspoc || "",  // Add clientspoc field
    ctcStart: job?.ctcStart || "",
    ctcEnd: job?.ctcEnd || "",
    location: job?.location || [],
    job_desc: job?.job_desc || "",
    commison: job?.commison || "",
    experience: job?.experience || "",
    pos_cat: job?.pos_cat || "",
    skill_category: job?.skill_category || "",
    comp_view: job?.comp_view || "",
    m_have: job?.m_have || "",
    g_have: job?.g_have || "",
    compet: job?.compet || "",
    key_res: job?.key_res || ""
  });

  useEffect(() => {
    setSkillCatsLoading(true);
    axios.get('/candidate/skill-categories')
      .then(res => setSkillCategories(res.data.categories || []))
      .catch(() => {})
      .finally(() => setSkillCatsLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submit) return;

    try {
      setSubmit(true);
      const payload = {
        ...form,
        pos_id: undefined,
        client: undefined,
        position: undefined
      };
      await axios.put(`/candidate/pos/update/${form.id}`, payload);
      alert("Position updated successfully!");
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Update failed!");
    } finally {
      setSubmit(false);
    }
  };

  const handleDelete = async () => {
    // Confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this position?\n\n` +
      `Position: ${form.position}\n` +
      `Position ID: ${form.pos_id}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);
      const res = await axios.delete(`/candidate/pos/delete/${form.id}`, {
        withCredentials: true
      });

      if (res.data.success) {
        alert("Position deleted successfully!");
        onUpdate();
        onClose();
      }
    } catch (err) {
      console.error("Delete error:", err);
      if (err.response?.status === 403) {
        alert(err.response.data.message || "You don't have permission to delete this position.");
      } else if (err.response?.status === 404) {
        alert("Position not found.");
      } else {
        alert("Failed to delete position. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = () => {
    // Prepare data for copying (exclude id and pos_id)
    const copiedPosition = {
      position: form.position,
      hr_name: form.hr_name,
      client: form.client,
      ctcStart: form.ctcStart,
      ctcEnd: form.ctcEnd,
      location: form.location,
      job_desc: form.job_desc,
      commison: form.commison,
      experience: form.experience,
      pos_cat: form.pos_cat,
      skill_category: form.skill_category,
      comp_view: form.comp_view,
      m_have: form.m_have,
      g_have: form.g_have,
      compet: form.compet,
      key_res: form.key_res
    };

    // Store copied data in sessionStorage for the Add Position tab
    sessionStorage.setItem('copiedPosition', JSON.stringify(copiedPosition));

    // Close modal and trigger parent to switch to add-position tab
    onClose();

    // Dispatch custom event to notify Admin component to switch tabs
    window.dispatchEvent(new CustomEvent('switchToAddPosition', {
      detail: { copiedPosition }
    }));
  };

  // Check if current user can delete this position
  const getUserFirstName = () => {
    if (!user) return "";
    if (user.firstName) return user.firstName;
    if (user.name) return user.name.split(' ')[0];
    if (user.displayName) return user.displayName.split(' ')[0];
    if (user.email) return user.email.split('@')[0];
    return "";
  };

  const canDelete = () => {
    // Check if user is admin or creator
    const userFirstName = getUserFirstName();
    const positionCreator = form.clientspoc || job?.clientspoc || "";

    const isCreator = positionCreator === userFirstName;
    const isAdmin = user?.role === 'admin' || user?.roleCategory === 'Admin';

    return isCreator || isAdmin;
  };

  // Hooks must run before this early return (rules-of-hooks)
  if (!job) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-auto flex justify-center items-start p-2 sm:p-4 lg:py-8">
      <div className="bg-white w-full max-w-6xl rounded-xl sm:rounded-2xl shadow-2xl my-4">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-orange-50">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg">
              <Edit size={16} className="sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-gray-900">Edit Position</h2>
              <p className="text-xs sm:text-sm text-gray-600">{form.position} (ID: {form.pos_id})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

            <Input label="Position Name" name="position" value={form.position} disabled />
            <Input label="Position ID" name="pos_id" value={form.pos_id} disabled />
            <Input label="HR Name" name="hr_name" value={form.hr_name} onChange={handleChange} />
            <Input label="Client" name="client" value={form.client} disabled />
            <Input label="Key Responsibilities" name="key_res" value={form.key_res} onChange={handleChange} />
            <Input label="Must Have" name="m_have" value={form.m_have} onChange={handleChange} />
            <Input label="Good To Have" name="g_have" value={form.g_have} onChange={handleChange} />
            <Input label="Competencies" name="compet" value={form.compet} onChange={handleChange} />
            <div className="flex flex-col">
              <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Experience</label>
              <ExperienceRange value={form.experience}
                onChange={v => setForm(f => ({ ...f, experience: v }))} />
            </div>
            <Input label="Commission (%)" name="commison" value={form.commison} onChange={handleChange} />

            <MultiSelect
              label="State"
              name="state"
              value={form.state}
              options={Object.keys(indiaStatesAndCities)}
              onChange={(states) => setForm({ ...form, state: states })}
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
              <CityMultiSelect
                value={form.location}
                onChange={(cities) => setForm({ ...form, location: cities })}
              />
            </div>

            <Textarea label="Company Overview" name="comp_view" value={form.comp_view} onChange={handleChange} />
            <Textarea label="Job Summary" name="job_desc" value={form.job_desc} onChange={handleChange} />

            <Select
              label="Position Category"
              name="pos_cat"
              value={form.pos_cat}
              options={["Immediate Hiring", "Interview Drives", "Fast Response", "High Commission", "New"]}
              onChange={handleChange}
            />

            <div className="flex flex-col">
              <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                Skill Category <span className="text-red-500">*</span>
              </label>
              <select
                name="skill_category"
                value={form.skill_category}
                onChange={handleChange}
                className="h-9 sm:h-11 border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-gray-700 transition-all"
                disabled={skillCatsLoading}
                required
              >
                <option value="">{skillCatsLoading ? 'Loading…' : 'Select Skill Category'}</option>
                {form.skill_category && !skillCategories.includes(form.skill_category) && (
                  <option key={form.skill_category} value={form.skill_category}>{form.skill_category}</option>
                )}
                {skillCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <Input label="CTC Start" name="ctcStart" value={form.ctcStart} onChange={handleChange} />
            <Input label="CTC End" name="ctcEnd" value={form.ctcEnd} onChange={handleChange} />

          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-2 border-gray-200">

            {/* Left side - Delete and Copy buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 order-2 sm:order-1">
              {canDelete() && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                  title="Delete this position (only creator or admin)"
                >
                  <Trash2 size={18} />
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all font-semibold shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                title="Create a copy of this position"
              >
                <Copy size={18} />
                Copy Position
              </button>
            </div>

            {/* Right side - Cancel and Update buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 order-1 sm:order-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submit}
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl hover:from-blue-700 hover:to-orange-600 transition-all font-semibold shadow-lg disabled:opacity-50 text-sm sm:text-base"
              >
                {submit ? "Updating..." : "Update Position"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export { EditJobModal };
export default EditJobModal;
