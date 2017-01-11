Ext.define('CA.technicalservices.userutilities.bulkmenu.TeamMembership', {
    alias: 'widget.teammembershipbulkmenuitem',
    extend: 'Rally.ui.menu.bulk.MenuItem',

    config: {
        text: 'Assign Team Membership...',

        handler: function () {
            var dialog = Ext.create('CA.technicalservices.userutilities.dialog.TeamMembership',{});
            dialog.on('updated', this.updateTeamMembership, this);
        },
        predicate: function (records) {

            var hasPermissions = CA.technicalservices.userutilities.ProjectUtility.hasAssignUserPermissions();
            return _.every(records, function(record) {
                return hasPermissions && record.get('WorkspacePermission') !== "Workspace Admin" &&
                    record.get('WorkspacePermission') !== "Subscription Admin";
            });
        },
        updateTeamMembership: function(dlg, selectionCache){
            var successfulRecords = [],
                unsuccessfulRecords = [];

            var promises = [];
            Ext.Array.each(this.records, function(r){
                var user = r.get('ObjectID');
                Ext.Object.each(selectionCache, function(permissionKey, projects){
                    promises.push(
                        function(){ return CA.technicalservices.userutilities.ProjectUtility.addTeamMembership(user,projects); });
                });
            });

            var records = this.records;
            Deft.Chain.sequence(promises).then({
                success: function(results){
                    console.log('results', results);
                    var idx = 0,
                        errorMessages = [];
                    Ext.Array.each(records, function(user){
                        var success = false;
                        Ext.Object.each(selectionCache, function(permissionKey, projects){
                            if (results[idx] && results[idx].success === true){
                                success = true;
                            } else {
                                if (!Ext.Array.contains(errorMessages, results[idx].message)){
                                    errorMessages.push(results[idx].message);
                                }
                            }
                            idx++;
                        });
                        if (!success){
                            unsuccessfulRecords.push(user);
                        } else {
                            successfulRecords.push(user);
                        }
                    });

                    this.onSuccess(successfulRecords, unsuccessfulRecords,null,errorMessages);
                    if (errorMessages.length > 0){
                        Rally.ui.notify.Notifier.showError({message: errorMessages.join(',')});
                    }
                },
                scope: this
            });


        },
        onSuccess: function (successfulRecords, unsuccessfulRecords, args, errorMessage) {

            var message = successfulRecords.length + (successfulRecords.length === 1 ? ' user has been updated' : ' users have been updated');

            if(successfulRecords.length === this.records.length) {
                Rally.ui.notify.Notifier.show({
                    message: message + '.'
                });
            } else {
                Rally.ui.notify.Notifier.showWarning({
                    message: message + ', but ' + unsuccessfulRecords.length + ' failed: ' + errorMessage
                });
            }

            Ext.callback(this.onActionComplete, null, [successfulRecords, unsuccessfulRecords]);
        }
    }
});