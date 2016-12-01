describe('CA.technicalservices.userutilities.BulkUserUtilityApp', function() {

    var app;

    beforeEach(function() {
        app = Rally.test.Harness.launchApp('CA.technicalservices.userutilities.BulkUserUtilityApp');
    });

    it('should render the app', function() {
        expect(app.getEl()).toBeDefined();
    });


    function performAdd(value) {
        var increment = app.down('#increment');
        increment.setValue(value);
        var add = app.down('rallybutton');
        add.fireEvent('click');
    }
    // Write app tests here!
    // Useful resources:
    // =================
    // Testing Apps Guide: https://help.rallydev.com/apps/2.1/doc/#!/guide/testing_apps
    // SDK2 Test Utilities: https://github.com/RallyApps/sdk2-test-utils
    
});


var dialog = Ext.create('CA.technicalservices.userutilities.ProjectSelectionDialog',{
    width: 800
});