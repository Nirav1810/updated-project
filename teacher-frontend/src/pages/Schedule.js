import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { scheduleService } from '../services/scheduleService';
import { classService } from '../services/classService';
import { toast } from 'react-hot-toast';

const SchedulePage = () => {
  const [selectedWeek, setSelectedWeek] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    classId: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    location: ''
  });

  const queryClient = useQueryClient();

  // Get current week in YYYY-WXX format
  const getCurrentWeek = () => {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    setSelectedWeek(getCurrentWeek());
  }, []);

  // Fetch weekly schedule - now fetches all teacher's schedules regardless of semester/year
  const { data: weeklySchedule, isLoading, error } = useQuery({
    queryKey: ['weeklySchedule', selectedWeek],
    queryFn: () => scheduleService.getWeeklySchedule({
      week: selectedWeek
    }),
    enabled: !!selectedWeek
  });

  // Fetch classes for dropdown
  const { data: classesData, isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['classes'],
    queryFn: classService.getClasses,
    onSuccess: (data) => {
      console.log('Classes data loaded:', data);
    },
    onError: (error) => {
      console.error('Classes loading error:', error);
    }
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: scheduleService.createSchedule,
    onSuccess: () => {
      toast.success('Schedule created successfully!');
      setShowCreateModal(false);
      setFormData({
        classId: '',
        dayOfWeek: '',
        startTime: '',
        endTime: '',
        location: ''
      });
      queryClient.invalidateQueries(['weeklySchedule']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create schedule');
    }
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: scheduleService.deleteSchedule,
    onSuccess: () => {
      toast.success('Schedule deleted successfully!');
      queryClient.invalidateQueries(['weeklySchedule']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete schedule');
    }
  });

  const timeSlots = scheduleService.getTimeSlots();
  const daysOfWeek = scheduleService.getDaysOfWeek();

  const handleCreateSchedule = (e) => {
    e.preventDefault();
    if (!formData.classId || !formData.dayOfWeek || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    createScheduleMutation.mutate(formData);
  };

  const handleSlotClick = (day, timeSlot) => {
    // Prevent scheduling during break times
    if (timeSlot.type === 'break') {
      toast.error('Cannot schedule classes during break time');
      return;
    }
    
    setSelectedSlot({ day, timeSlot });
    setFormData({
      ...formData,
      dayOfWeek: day.id,
      startTime: timeSlot.start,
      endTime: timeSlot.end
    });
    setShowCreateModal(true);
  };

  const handleDeleteSchedule = (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      deleteScheduleMutation.mutate(scheduleId);
    }
  };

  const getScheduleForSlot = (dayId, timeSlot) => {
    if (!weeklySchedule?.data?.weeklySchedule) return null;
    
    const daySchedules = weeklySchedule.data.weeklySchedule[dayId];
    if (!daySchedules || !Array.isArray(daySchedules)) return null;
    
    return daySchedules.find(schedule => 
      schedule.startTime === timeSlot.start && 
      schedule.endTime === timeSlot.end
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Error loading schedule: {error.response?.data?.message || error.message}</p>
        <button 
          onClick={() => queryClient.invalidateQueries(['weeklySchedule'])}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Schedule</h1>
          <p className="text-gray-600">All Classes Schedule</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Week selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
            <input
              type="week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors mt-6"
          >
            Add Schedule
          </button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Time
                </th>
                {daysOfWeek.map((day) => (
                  <th key={day.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeSlots.map((timeSlot) => (
                <tr key={timeSlot.id} className={`hover:bg-gray-50 ${timeSlot.type === 'break' ? 'bg-gray-100' : ''}`}>
                  <td className={`px-4 py-6 whitespace-nowrap text-sm font-medium ${timeSlot.type === 'break' ? 'text-gray-600 bg-gray-200' : 'text-gray-900 bg-gray-50'}`}>
                    {timeSlot.label}
                  </td>
                  {timeSlot.type === 'break' ? (
                    // Render break row spanning all days
                    <td colSpan={daysOfWeek.length} className="px-2 py-2 text-center">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 h-20 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-orange-800">
                            {timeSlot.id === 'break1' ? '🧘 Refreshment Break' : '🍽️ Lunch Break'}
                          </div>
                          <div className="text-xs text-orange-600">
                            {timeSlot.duration} minutes
                          </div>
                          {timeSlot.id === 'break1' && (
                            <div className="text-xs text-orange-500 mt-1">
                              Time to freshen up
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  ) : (
                    // Render normal class slots for each day
                    daysOfWeek.map((day) => {
                      const schedule = getScheduleForSlot(day.id, timeSlot);
                      return (
                        <td key={day.id} className="px-2 py-2 text-center relative">
                          {schedule ? (
                            <div className="bg-indigo-100 border border-indigo-200 rounded-lg p-3 h-20 flex flex-col justify-between hover:bg-indigo-200 transition-colors group">
                              <div>
                                <div className="text-sm font-semibold text-indigo-900">
                                  {schedule.class?.subjectCode || 'Unknown'}
                                </div>
                                <div className="text-xs text-indigo-700">
                                  {schedule.class?.subjectName || 'N/A'}
                                </div>
                                <div className="text-xs text-indigo-600">
                                  Sem {schedule.class?.semester} | {schedule.class?.division}
                                </div>
                                {schedule.location && (
                                  <div className="text-xs text-indigo-500">
                                    📍 {schedule.location}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteSchedule(schedule._id)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSlotClick(day, timeSlot)}
                              className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
                            >
                              <span className="text-2xl">+</span>
                            </button>
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Schedule</h3>
              <form onSubmit={handleCreateSchedule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({...formData, classId: e.target.value})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">
                      {classesLoading ? 'Loading classes...' : 'Select a class'}
                    </option>
                    {classesError && (
                      <option value="" disabled>Error loading classes</option>
                    )}
                    {classesData && (
                      // Handle different possible data structures
                      (Array.isArray(classesData) ? classesData : classesData.data || classesData.classes || [])?.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.subjectCode || cls.code} - {cls.subjectName || cls.name || cls.subject} 
                          {cls.semester && ` | Sem ${cls.semester}`}
                          {cls.classYear && ` | ${cls.classYear}`}
                          {cls.division && ` | Div ${cls.division}`}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Classes from all semesters and years will be shown
                    {classesError && <span className="text-red-500"> - Error: {classesError.message}</span>}
                    {classesData && <span className="text-green-500"> - {(Array.isArray(classesData) ? classesData : classesData.data || classesData.classes || [])?.length || 0} classes found</span>}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select a day</option>
                    {daysOfWeek.map((day) => (
                      <option key={day.id} value={day.id}>{day.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                {/* Alternative: Quick Time Slot Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Or select from available slots</label>
                  <select
                    value=""
                    onChange={(e) => {
                      const selectedSlot = timeSlots.find(slot => slot.id.toString() === e.target.value);
                      if (selectedSlot && selectedSlot.type === 'class') {
                        setFormData({
                          ...formData,
                          startTime: selectedSlot.start,
                          endTime: selectedSlot.end
                        });
                      }
                    }}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a time slot</option>
                    {timeSlots.filter(slot => slot.type === 'class').map((slot) => (
                      <option key={slot.id} value={slot.id}>{slot.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., C-204, E-201"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createScheduleMutation.isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {createScheduleMutation.isLoading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;