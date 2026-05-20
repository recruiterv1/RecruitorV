export const getRouteFromCategory = (category) => {
  const routeMap = {
    "Freshers & College Pass-outs": "/fresher",
    "Career Switchers": "/switch-career",
    "Corporate Recruiters": "/corporate",
    "Career Restart": "/restart",
    "Full-Time Freelancing": "/freelance",
    "Elite Partner Program": "/established"
  };
  
  return routeMap[category] || "/main/area"; // default fallback
};