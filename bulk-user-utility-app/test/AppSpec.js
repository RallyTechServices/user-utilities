describe('CA.technicalservices.userutilities.BulkUserUtilityApp', function() {

    it('should render the app', function() {
        var app = Rally.test.Harness.launchApp('CA.technicalservices.userutilities.BulkUserUtilityApp');
        expect(app.getEl()).toBeDefined();
    });
    
    // Write app tests here!
    // Useful resources:
    // =================
    // Testing Apps Guide: https://help.rallydev.com/apps/2.1/doc/#!/guide/testing_apps
    // SDK2 Test Utilities: https://github.com/RallyApps/sdk2-test-utils
    
});
