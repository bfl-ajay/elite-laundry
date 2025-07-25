// Export all middleware
module.exports = {
  auth: require('./auth'),
  errorHandler: require('./errorHandler'),
  validation: require('./validation')
};