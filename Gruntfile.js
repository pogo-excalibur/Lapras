'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    eslint: {
		  options: {
		  	configFile: '.eslintrc.json'
		  },
		  src: [
        'lib/**/*.js',
        'test/**/*.js'
      ]
    },
    nodeunit: {
      files: ['test/**/*_test.js'],
    }
  });

  grunt.loadNpmTasks('gruntify-eslint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  grunt.registerTask('default', ['eslint', 'nodeunit']);
  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('test', ['nodeunit']);
};
