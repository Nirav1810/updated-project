import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { attendanceService } from '../../services/attendanceService';

const AttendanceTracker = ({ classId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState([]);
  
  const { mutate: markAttendance, isLoading } = useMutation(
    attendanceService.markAttendance,
    {
      onSuccess: () => {
        alert('Attendance marked successfully!');
      },
      onError: (error) => {
        alert(`Error: ${error.response.data.message}`);
      }
    }
  );

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => {
      const existing = prev.find(item => item.studentId === studentId);
      if (existing) {
        return prev.map(item => 
          item.studentId === studentId ? { ...item, status } : item
        );
      }
      return [...prev, { studentId, status }];
    });
  };

  const handleSubmit = () => {
    markAttendance({
      classId,
      date: selectedDate,
      attendance: attendanceData
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Mark Attendance</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="space-y-2">
        {/* Student list would be populated from API */}
        <div className="flex justify-between items-center p-2 border-b">
          <span>John Doe</span>
          <div className="space-x-2">
            <button 
              onClick={() => handleAttendanceChange(1, 'present')}
              className="px-3 py-1 bg-green-100 text-green-800 rounded"
            >
              Present
            </button>
            <button 
              onClick={() => handleAttendanceChange(1, 'absent')}
              className="px-3 py-1 bg-red-100 text-red-800 rounded"
            >
              Absent
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="mt-4 w-full bg-blue-500 text-white py-2 rounded disabled:bg-blue-300"
      >
        {isLoading ? 'Submitting...' : 'Submit Attendance'}
      </button>
    </div>
  );
};

export default AttendanceTracker;