Ext.define('CA.technicalservices.userutilities.bulkmenu.AssignPermissions', {
    alias: 'widget.assignpermissionsbulkmenuitem',
    extend: 'Rally.ui.menu.bulk.MenuItem',

    config: {
        text: 'Assign Permissions...',

        handler: function () {
            var dialog = Ext.create('CA.technicalservices.userutilities.dialog.AssignProjectPermissions',{});
            dialog.on('updated', this.assignPermissions, this);
        },
        predicate: function (records) {
            var hasPermissions = CA.technicalservices.userutilities.ProjectUtility.hasAssignUserPermissions();
            return _.every(records, function(record) {
                return hasPermissions && record.get('WorkspacePermission') !== "Workspace Admin" &&
                    record.get('WorkspacePermission') !== "Subscription Admin";
            });
        },

        assignPermissions: function(dlg, selectionCache){
            var successfulRecords = [],
                unsuccessfulRecords = [];

            var promises = [];
            Ext.Array.each(this.records, function(r){
                var user = r.get('ObjectID');
                Ext.Object.each(selectionCache, function(permissionKey, projects){
                    var permission = CA.technicalservices.userutilities.ProjectUtility.getPermission(permissionKey);
                    promises.push(function(){ return CA.technicalservices.userutilities.ProjectUtility.assignPermissions(user, permission,projects); });
                });
            });

            var records = this.records;
            console.log('this', this);
           this.setLoading('Updating Permissions...');
            Deft.Chain.sequence(promises).then({
                success: function(results){
                    var idx = 0,
                        errorMessages = [];
                    Ext.Array.each(records, function(user){
                        var success = false;
                        Ext.Object.each(selectionCache, function(permissionKey, projects){
                            console.log('results', user.get('ObjectID'), permissionKey, results[idx][0]);
                            if (results[idx] && results[idx][0].success === true){
                                success = true;
                            } else {
                                if (!Ext.Array.contains(errorMessages, results[idx][0].message)){
                                    errorMessages.push(results[idx][0].message);
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
                    console.log('records', successfulRecords, unsuccessfulRecords);
                    if (successfulRecords.length > 0){
                        this.onSuccess(successfulRecords, unsuccessfulRecords,null,errorMessages);
                    } else {
                        if (errorMessages.length > 0){
                            Rally.ui.notify.Notifier.showError({message: "0 Users were updated:<br/>" + errorMessages.join('<br/>')});
                        }
                    }
                    //this.onActionComplete(successfulRecords, unsuccessfulRecords);
                    if (errorMessages.length > 0){
                        Rally.ui.notify.Notifier.showError({message: errorMessages.join(',')});
                    }
                },
                scope: this
            }).always(function(){ this.setLoading(false);}, this);


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