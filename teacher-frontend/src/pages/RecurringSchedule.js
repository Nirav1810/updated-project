import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { recurringScheduleService } from '../services/recurringScheduleService';
import { classService } from '../services/classService';
import { useModal } from '../hooks/useModal';
import AlertModal from '../components/common/AlertModal';
import ConfirmModal from '../components/common/ConfirmModal';

const RecurringSchedule = () => {
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly', 'today', 'list'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const queryClient = useQueryClient();
  const { alertModal, confirmModal, showAlert, showConfirm, closeAlert, closeConfirm } = useModal();

  // Fetch recurring schedules
  const { data: recurringSchedules, isLoading: schedulesLoading } = useQuery(
    'recurringSchedules',
    recurringScheduleService.getRecurringSchedules
  );

  // Fetch classes for dropdown
  const { data: classes } = useQuery(
    'classes',
    classService.getClasses
  );

  // Fetch today's schedule
  const { data: todaysSchedule } = useQuery(
    'todaysSchedule',
    recurringScheduleService.getTodaysSchedule
  );

  // Create recurring schedule mutation
  const createScheduleMutation = useMutation(
    recurringScheduleService.createRecurringSchedule,
    {
      onSuccess: () => {
        showAlert('Recurring schedule created successfully!', 'success');
        queryClient.invalidateQueries('recurringSchedules');
        queryClient.invalidateQueries('todaysSchedule');
        setIsCreateModalOpen(false);
      },
      onError: (error) => {
        showAlert(`Error: ${error.response?.data?.message || 'Failed to create schedule'}`, 'error');
      }
    }
  );

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation(
    recurringScheduleService.deleteRecurringSchedule,
    {
      onSuccess: () => {
        showAlert('Schedule deleted successfully!', 'success');
        queryClient.invalidateQueries('recurringSchedules');
        queryClient.invalidateQueries('todaysSchedule');
      },
      onError: (error) => {
        showAlert(`Error: ${error.response?.data?.message || 'Failed to delete schedule'}`, 'error');
      }
    }
  );

  const handleDeleteSchedule = (schedule) => {
    showConfirm(
      `Are you sure you want to delete the recurring schedule for "${schedule.title}"? This will cancel all future classes.`,
      () => deleteScheduleMutation.mutate(schedule._id),
      {
        title: 'Delete Recurring Schedule',
        type: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    );
  };

  const schedulesArray = recurringSchedules?.data || [];
  const classesArray = Array.isArray(classes) ? classes : [];
  const todaysClasses = todaysSchedule?.data || [];

  const getDayColor = (dayOfWeek) => {
    const colors = {
      'Monday': 'bg-blue-100 text-blue-800',
      'Tuesday': 'bg-green-100 text-green-800',
      'Wednesday': 'bg-yellow-100 text-yellow-800',
      'Thursday': 'bg-purple-100 text-purple-800',
      'Friday': 'bg-red-100 text-red-800',
      'Saturday': 'bg-indigo-100 text-indigo-800'
    };
    return colors[dayOfWeek] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Semester Schedule</h1>
          <p className="text-gray-600 mt-1">Manage your recurring schedules for the entire semester</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Create Recurring Schedule
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'today', name: "Today's Classes", icon: '📋' },
            { id: 'weekly', name: 'Weekly Pattern', icon: '📅' },
            { id: 'list', name: 'All Schedules', icon: '📝' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'today' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Today's Classes</h2>
          {todaysClasses.length > 0 ? (
            <div className="space-y-4">
              {todaysClasses.map((classInstance) => (
                <div key={classInstance._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {classInstance.classId.subjectCode} - {classInstance.classId.subjectName}
                      </h3>
                      <p className="text-gray-600">
                        {classInstance.startTime} - {classInstance.endTime} | Room: {classInstance.roomNumber}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                        classInstance.sessionType === 'lecture' ? 'bg-blue-100 text-blue-800' :
                        classInstance.sessionType === 'lab' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {classInstance.sessionType.toUpperCase()}
                      </span>
                      {classInstance.isOverridden && (
                        <span className="ml-2 inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Modified: {classInstance.overrideReason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No classes today</h3>
              <p className="text-gray-500">Enjoy your free day!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'weekly' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Weekly Schedule Pattern</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
              const daySchedules = schedulesArray.filter(s => s.dayOfWeek === day);
              return (
                <div key={day} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm ${getDayColor(day)}`}>
                      {day}
                    </span>
                  </h3>
                  {daySchedules.length > 0 ? (
                    <div className="space-y-2">
                      {daySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((schedule) => (
                        <div key={schedule._id} className="bg-gray-50 rounded p-3 text-sm">
                          <div className="font-medium">{schedule.classId.subjectCode}</div>
                          <div className="text-gray-600">{schedule.startTime} - {schedule.endTime}</div>
                          <div className="text-gray-500">Room: {schedule.roomNumber}</div>
                          <div className="flex justify-between items-center mt-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              schedule.sessionType === 'lecture' ? 'bg-blue-100 text-blue-700' :
                              schedule.sessionType === 'lab' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {schedule.sessionType}
                            </span>
                            <button
                              onClick={() => handleDeleteSchedule(schedule)}
                              className="text-red-600 hover:text-red-800 text-xs"
                              disabled={deleteScheduleMutation.isLoading}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <div className="text-2xl mb-2">📭</div>
                      <div className="text-xs">No classes</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">All Recurring Schedules</h2>
          </div>
          {schedulesArray.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {schedulesArray.map((schedule) => (
                <div key={schedule._id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {schedule.title}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {schedule.classId.subjectCode} - {schedule.classId.subjectName}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDayColor(schedule.dayOfWeek)}`}>
                          {schedule.dayOfWeek}
                        </span>
                        <span className="text-sm text-gray-500">
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                        <span className="text-sm text-gray-500">
                          Room: {schedule.roomNumber}
                        </span>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          schedule.sessionType === 'lecture' ? 'bg-blue-100 text-blue-800' :
                          schedule.sessionType === 'lab' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {schedule.sessionType.toUpperCase()}
                        </span>
                      </div>
                      {schedule.description && (
                        <p className="text-sm text-gray-600 mt-2">{schedule.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleDeleteSchedule(schedule)}
                        className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200"
                        disabled={deleteScheduleMutation.isLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No recurring schedules</h3>
              <p className="text-gray-500 mb-4">Create your first recurring schedule to get started</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                Create Schedule
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Schedule Modal */}
      {isCreateModalOpen && (
        <CreateRecurringScheduleModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={(data) => createScheduleMutation.mutate(data)}
          classes={classesArray}
          isLoading={createScheduleMutation.isLoading}
          showAlert={showAlert}
          showConfirm={showConfirm}
          existingSchedules={recurringSchedules?.data || []}
        />
      )}

      {/* Modals */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={closeAlert}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        onConfirm={() => {
          if (confirmModal.onConfirm) {
            confirmModal.onConfirm();
          }
        }}
        onClose={closeConfirm}
      />
    </div>
  );
};

// Simple Create Modal Component (inline for now)
const CreateRecurringScheduleModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  classes, 
  isLoading, 
  showAlert,
  showConfirm,
  existingSchedules = []
}) => {
  const [scheduleMode, setScheduleMode] = React.useState('weekly'); // 'single' or 'weekly'
  const [weeklySchedules, setWeeklySchedules] = React.useState({});
  const [globalSettings, setGlobalSettings] = React.useState({
    semester: 'VII',
    academicYear: '2025-26',
    semesterStartDate: '2025-08-01',
    semesterEndDate: '2025-12-15'
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    { id: '09:00-10:00', start: '09:00', end: '10:00', label: '9:00 AM - 10:00 AM' },
    { id: '10:00-11:00', start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
    { id: '11:15-12:15', start: '11:15', end: '12:15', label: '11:15 AM - 12:15 PM' },
    { id: '12:15-13:15', start: '12:15', end: '13:15', label: '12:15 PM - 1:15 PM' },
    { id: '14:00-15:00', start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
    { id: '15:00-16:00', start: '15:00', end: '16:00', label: '3:00 PM - 4:00 PM' },
    { id: '16:15-17:15', start: '16:15', end: '17:15', label: '4:15 PM - 5:15 PM' }
  ];

  const classesArray = Array.isArray(classes) ? classes : [];

  // Weekly Grid Functions (same as Schedule.js)
  const checkTimeConflict = (day, timeSlot) => {
    return existingSchedules.some(schedule => 
      schedule.dayOfWeek === day && 
      schedule.startTime === timeSlot.start && 
      schedule.endTime === timeSlot.end
    );
  };

  const getConflictingSchedule = (day, timeSlot) => {
    return existingSchedules.find(schedule => 
      schedule.dayOfWeek === day && 
      schedule.startTime === timeSlot.start && 
      schedule.endTime === timeSlot.end
    );
  };

  const handleCellClick = (day, timeSlot) => {
    const cellKey = `${day}-${timeSlot.id}`;
    
    if (checkTimeConflict(day, timeSlot)) {
      const conflictingSchedule = getConflictingSchedule(day, timeSlot);
      const roomInfo = conflictingSchedule.roomNumber ? ` in Room ${conflictingSchedule.roomNumber}` : '';
      const subjectInfo = conflictingSchedule.classId?.subjectCode ? ` (${conflictingSchedule.classId.subjectCode})` : '';
      showAlert(
        'Schedule Conflict',
        `You already have a class scheduled on ${day} from ${timeSlot.start} to ${timeSlot.end}${roomInfo}.\n\nExisting Schedule: ${conflictingSchedule.title}${subjectInfo}\nSession Type: ${conflictingSchedule.sessionType}\n\nPlease choose a different time slot.`,
        'warning'
      );
      return;
    }

    setWeeklySchedules(prev => {
      const current = prev[cellKey];
      if (current) {
        const newSchedules = { ...prev };
        delete newSchedules[cellKey];
        return newSchedules;
      } else {
        return {
          ...prev,
          [cellKey]: {
            day,
            timeSlot,
            classId: '',
            sessionType: 'lecture',
            roomNumber: '',
            description: ''
          }
        };
      }
    });
  };

  const updateCellData = (cellKey, field, value) => {
    setWeeklySchedules(prev => {
      const updated = {
        ...prev,
        [cellKey]: {
          ...prev[cellKey],
          [field]: value
        }
      };

      if (field === 'classId' && value) {
        const [day, timeSlotId] = cellKey.split('-');
        const currentTimeIndex = timeSlots.findIndex(slot => slot.id === timeSlotId);
        
        let adjacentSlotWithSameClass = null;
        
        if (currentTimeIndex < timeSlots.length - 1) {
          const nextSlot = timeSlots[currentTimeIndex + 1];
          const nextCellKey = `${day}-${nextSlot.id}`;
          const nextSchedule = updated[nextCellKey];
          
          if (nextSchedule && nextSchedule.classId === value) {
            adjacentSlotWithSameClass = { type: 'next', slot: nextSlot, key: nextCellKey };
          }
        }
        
        if (currentTimeIndex > 0) {
          const prevSlot = timeSlots[currentTimeIndex - 1];
          const prevCellKey = `${day}-${prevSlot.id}`;
          const prevSchedule = updated[prevCellKey];
          
          if (prevSchedule && prevSchedule.classId === value) {
            adjacentSlotWithSameClass = { type: 'prev', slot: prevSlot, key: prevCellKey };
          }
        }

        if (adjacentSlotWithSameClass) {
          setTimeout(() => {
            const classInfo = classesArray.find(cls => cls._id === value);
            const subjectName = classInfo ? classInfo.subjectName : 'Selected Subject';
            
            showConfirm(
              `You have selected ${subjectName} for consecutive time slots. Would you like to merge them into a single lab session?`,
              () => {
                if (adjacentSlotWithSameClass.type === 'next') {
                  const currentSlot = timeSlots[currentTimeIndex];
                  const nextSlot = adjacentSlotWithSameClass.slot;
                  
                  setWeeklySchedules(prevSchedules => {
                    const newSchedules = { ...prevSchedules };
                    newSchedules[cellKey] = {
                      ...newSchedules[cellKey],
                      sessionType: 'lab',
                      isMerged: true,
                      mergedWith: adjacentSlotWithSameClass.key,
                      endTime: nextSlot.end,
                      timeRange: `${currentSlot.start}-${nextSlot.end}`
                    };
                    delete newSchedules[adjacentSlotWithSameClass.key];
                    return newSchedules;
                  });
                  
                  showAlert('Merged to Lab', `Successfully merged consecutive ${subjectName} slots into a lab session (${currentSlot.start}-${nextSlot.end}).`, 'success');
                } else if (adjacentSlotWithSameClass.type === 'prev') {
                  const currentSlot = timeSlots[currentTimeIndex];
                  const prevSlot = adjacentSlotWithSameClass.slot;
                  
                  setWeeklySchedules(prevSchedules => {
                    const newSchedules = { ...prevSchedules };
                    newSchedules[adjacentSlotWithSameClass.key] = {
                      ...newSchedules[adjacentSlotWithSameClass.key],
                      sessionType: 'lab',
                      isMerged: true,
                      mergedWith: cellKey,
                      endTime: currentSlot.end,
                      timeRange: `${prevSlot.start}-${currentSlot.end}`
                    };
                    delete newSchedules[cellKey];
                    return newSchedules;
                  });
                  
                  showAlert('Merged to Lab', `Successfully merged consecutive ${subjectName} slots into a lab session (${prevSlot.start}-${currentSlot.end}).`, 'success');
                }
              },
              {
                title: 'Merge to Lab Session?',
                type: 'info',
                confirmText: 'Merge to Lab',
                cancelText: 'Keep Separate'
              }
            );
          }, 100);
        }
      }

      return updated;
    });
  };

  const handleSubmitWeekly = async () => {
    const schedules = Object.values(weeklySchedules);
    
    const invalidSchedules = schedules.filter(schedule => 
      !schedule.classId || !schedule.roomNumber?.trim()
    );
    
    if (invalidSchedules.length > 0) {
      showAlert('Validation Error', `Please fill in all required fields (Subject and Room) for all ${invalidSchedules.length} incomplete schedule(s).`, 'error');
      return;
    }

    const schedulesToCreate = schedules.map(schedule => ({
      classId: schedule.classId,
      sessionType: schedule.sessionType,
      dayOfWeek: schedule.day,
      startTime: schedule.timeSlot.start,
      endTime: schedule.isMerged && schedule.timeRange ? schedule.timeRange.split('-')[1] : schedule.timeSlot.end,
      roomNumber: schedule.roomNumber,
      semester: globalSettings.semester,
      academicYear: globalSettings.academicYear,
      semesterStartDate: globalSettings.semesterStartDate,
      semesterEndDate: globalSettings.semesterEndDate,
      description: schedule.description || ''
    }));

    try {
      for (const scheduleData of schedulesToCreate) {
        await onSubmit(scheduleData);
      }
      showAlert('Success', `Successfully created ${schedulesToCreate.length} recurring schedules!`, 'success');
      onClose();
    } catch (error) {
      showAlert('Error', `Failed to create schedules: ${error.message}`, 'error');
    }
  };

  const handleGlobalSettingsChange = (e) => {
    setGlobalSettings(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  const [formData, setFormData] = useState({
    classId: '',
    sessionType: 'lecture',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    roomNumber: '',
    semester: 'VII',
    academicYear: '2025-26',
    semesterStartDate: '2025-08-01',
    semesterEndDate: '2025-12-15',
    description: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Create Recurring Schedule</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>
                    {cls.subjectCode} - {cls.subjectName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
              <select
                name="sessionType"
                value={formData.sessionType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="lecture">Lecture</option>
                <option value="lab">Lab</option>
                <option value="tutorial">Tutorial</option>
                <option value="project">Project</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
              <select
                name="dayOfWeek"
                value={formData.dayOfWeek}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
              <input
                type="text"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                required
                placeholder="e.g., C-204"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <input
                type="text"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                required
                placeholder="e.g., VII"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <input
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                required
                placeholder="e.g., 2025-26"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester Start</label>
              <input
                type="date"
                name="semesterStartDate"
                value={formData.semesterStartDate}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester End</label>
              <input
                type="date"
                name="semesterEndDate"
                value={formData.semesterEndDate}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional details about this schedule..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringSchedule;
