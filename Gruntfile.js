module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> v<%= pkg.version %> | Built <%= grunt.template.today("yyyy-mm-dd") %> | Licence https://github.com/RogerNoble/html5pivotviewer/blob/develop/LICENSE */\n'
      },
      build: {
        src: [
          'src/namespaces.js',
          'src/pubsub.js',
          'src/utils.js',
          'src/models.js',
          'src/collectionloader.js',
          'src/views/ipivotviewerview.js',
          'src/views/tilebasedview.js',
          'src/views/dataview.js',
          'src/views/graphview.js',
          'src/views/gridview.js',
          'src/views/iimagecontroller.js',
          'src/views/LoadImageSetHelper.js',
          'src/views/tableview.js',
          'src/views/tilecontroller.js',
          'src/views/deepzoom.js',
          'src/pivotviewer.js'
        ],
        dest: 'build/<%= pkg.name %>-<%= pkg.version %>.min.js'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['uglify']);

};