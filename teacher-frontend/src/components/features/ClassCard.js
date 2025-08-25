import React from 'react';
import { Link } from 'react-router-dom';

const ClassCard = ({ classItem }) => {
  console.log('ClassCard received:', classItem);
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {classItem.subjectCode} - {classItem.subjectName}
        </h3>
        <p className="text-gray-600 mt-2">
          Year {classItem.classYear} | Semester {classItem.semester} | Division {classItem.division}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Class Number: {classItem.classNumber}
        </p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {classItem.studentCount || 0} students
          </span>
          <Link 
            to={`/classes/${classItem._id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;