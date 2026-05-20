import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const CV = () => {

  const FILTER_LABELS = {
  curr_loc: "Current Location",
  pos_name: "Position Name",
  rel_exp: "Relevant Experience",
  tech_category: "Technical Category",
  emails: "Email Address",
  offer_amt: "Offered Amount",
  mob: "Mobile Number",
  pref_loc: "Preferred Location"
  };




  const [filters, setFilters] = useState({
     curr_loc: "",
     pos_name: "",
     rel_exp: "",
     tech_category: "",
     emails: "",
     offer_amt: "",
     mob: "",
     pref_loc: "",
  });

  const [cvinput,setCVinput]=useState([]);

  useEffect(()=>{
    axios
      .get('/addit/show/all/candi')
      .then((res)=>(setCVinput(res.data)))
      .catch((error)=> (console.log(error)))

  },[])

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };



const filteredCVs = cvinput.filter((cv) => {
  return (
    (!filters.curr_loc || cv.curr_loc?.toLowerCase().includes(filters.curr_loc.toLowerCase())) &&
    (!filters.pos_name || cv.pos_name?.toLowerCase().includes(filters.pos_name.toLowerCase())) &&
    (!filters.rel_exp || cv.rel_exp >= Number(filters.rel_exp)) &&
    (!filters.tech_category || cv.tech_category?.toLowerCase().includes(filters.tech_category.toLowerCase())) &&
    (!filters.emails || cv.emails?.toLowerCase().includes(filters.emails.toLowerCase())) &&
    (!filters.offer_amt || Number(cv.offer_amt) >= Number(filters.offer_amt)) &&
    (!filters.mob || cv.mob?.includes(filters.mob)) &&
    (!filters.pref_loc || cv.pref_loc?.toLowerCase().includes(filters.pref_loc.toLowerCase()))
  );
});


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
    <div className="w-full max-w-6xl flex justify-between items-center mb-6">
     <h1 className="text-3xl font-bold text-blue-700">Resume Database</h1>

     {/* <Link 
    to="/dash_rec" 
    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition"
    >
    View Dashboard
    </Link> */}
    </div>
      {/* Filters */}
<div className="w-full max-w-6xl bg-white p-6 rounded-xl shadow border border-blue-100 mb-8">
  <h2 className="text-xl font-semibold text-blue-600 mb-4">Search & Filter</h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {Object.keys(filters).map((field) => (
      <div key={field} className="flex flex-col">
        <label className="text-sm font-medium text-gray-600 mb-1">
          {FILTER_LABELS[field] || field}
        </label>

        <input
          type="text"
          name={field}
          value={filters[field]}
          onChange={handleChange}
          placeholder={`Enter ${FILTER_LABELS[field] || field}`}
          className="border rounded-lg p-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
    ))}
  </div>
</div>


      {/* CV Table */}
      <div className="w-full max-w-6xl bg-white border border-blue-100 rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="py-3 px-4 text-sm font-semibold">Name</th>
              <th className="py-3 px-4 text-sm font-semibold">Email</th>
              <th className="py-3 px-4 text-sm font-semibold">Location</th>
              <th className="py-3 px-4 text-sm font-semibold">Experience</th>
              <th className="py-3 px-4 text-sm font-semibold">Skills</th>
              <th className="py-3 px-4 text-sm font-semibold">Mobile No.</th>
              <th className="py-3 px-4 text-sm font-semibold">Salary</th>
              <th className="py-3 px-4 text-sm font-semibold">Preferred Location</th>
              <th className="py-3 px-4 text-sm font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCVs.map((cv, index) => (
              <tr key={cv.id} className="odd:bg-blue-50 hover:bg-blue-100 transition-colors">
                <td className="py-3 px-4 font-medium text-blue-700">{cv.candidate}</td>
                <td className="py-3 px-4">{cv.emails}</td>
                <td className="py-3 px-4">{cv.curr_loc}</td>
                <td className="py-3 px-4">{cv.rel_exp}</td>
                <td className="py-3 px-4">{cv.pos_name}</td>
                <td className="py-3 px-4">{cv.mob}</td>
                <td className="py-3 px-4">{cv.offer_amt}</td>
                <td className="py-3 px-4">{cv.pref_loc}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center space-x-3">
                    <a
                      href={cv.cv_data}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                    >
                      View & Download
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCVs.length === 0 && (
        <div className="text-gray-500 mt-6">No matching CVs found.</div>
      )}
    </div>
  );
};

export default CV;

