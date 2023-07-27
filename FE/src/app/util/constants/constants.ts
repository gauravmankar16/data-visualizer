// follow camel case for constant names
export const constants = {

  statusCode: {
    success: 200,
    created: 201,
    internalServerError: 500
  },

  messages: {
    machineRequired: 'Machine is required',
    operatorNameRequired: 'Operator Name is required',
    jobNameRequired: 'Job Name is required',
    targetQtyRequired: 'Target qty is required',
    actualyQtyRequired: 'Actual qty is required',
    startTimeRequired: 'Start time is required',
    endTimeRequired: 'End time is required',
    endTimeError: 'End time cannot be before the start time',
    endTimePassed: 'End time has passed',
    startTimePassed: 'Start time has passed',
    updateMessage: 'Updated successfully',
    saveMessage: 'Saved successfully',
    errorMessage: 'Something went wrong!'
  }

}
