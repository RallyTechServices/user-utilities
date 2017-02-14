Ext.define('CA.technicalservices.userutilities.bulkmenu.AssignPermissions', {
    alias: 'widget.assignpermissionsbulkmenuitem',
    extend: 'Rally.ui.menu.bulk.MenuItem',

    config: {
        text: 'Assign Permissions...',

        handler: function () {
            var height = Ext.getBody().getViewSize().height,
                width = Ext.getBody().getViewSize().width;
            var dialog = Ext.create('CA.technicalservices.userutilities.dialog.AssignProjectPermissions',{
                height: height,
                width: width *.80
            });
            dialog.alignTo(Ext.getBody(), "t-t");
            dialog.on('updated', this.assignPermissions, this);
        },
        predicate: function (records) {
            var hasPermissions = CA.technicalservices.userutilities.ProjectUtility.hasAssignUserPermissions();
            return hasPermissions;
            //return _.every(records, function(record) {
            //    return hasPermissions && record.get('WorkspacePermission') !== "Workspace Admin" &&
            //        record.get('WorkspacePermission') !== "Subscription Admin";
            //});
        },

        assignPermissions: function(dlg, selectionCache, overwrite){
            var successfulRecords = [],
                unsuccessfulRecords = [];

            var allRecords = this.records,
                eligibleUsers = [],
                ineligibleUsers = 0;

            var promises = [];



            Ext.Array.each(allRecords, function(r){
                var user = r.get('ObjectID');
                var eligible = r.get('WorkspacePermission') !== "Workspace Admin"
                    && r.get('WorkspacePermission') !== "Subscription Admin"
                    && r.get('Disabled') === false;

                if (eligible){
                    eligibleUsers.push(r);
                    Ext.Object.each(selectionCache, function(permissionKey, projects){
                        var permission = CA.technicalservices.userutilities.ProjectUtility.getPermission(permissionKey);
                        promises.push(function(){ return CA.technicalservices.userutilities.ProjectUtility.assignPermissions(user, permission,projects, overwrite); });

                    });
                } else {
                    ineligibleUsers++;
                }

            });

            Rally.getApp().setLoading('Updating permissions for ' + eligibleUsers.length + ' users...');
            Deft.Chain.sequence(promises).then({
                success: function(results){
                    var idx = 0,
                        errorMessages = [];
                    Ext.Array.each(eligibleUsers, function(user){
                        var success = false;
                        Ext.Object.each(selectionCache, function(permissionKey, projects){

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

                    if (successfulRecords.length > 0){
                        this.onSuccess(successfulRecords, unsuccessfulRecords,null,errorMessages, ineligibleUsers);
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
            }).always(function(){
                Rally.getApp().setLoading(false);
                if (ineligibleUsers > 0){
                }
            }, this);


        },
        onSuccess: function (successfulRecords, unsuccessfulRecords, args, errorMessage, ineligibleUsers) {

            var message = successfulRecords.length + (successfulRecords.length === 1 ? ' user has been updated successfully' : ' users have been updated successfully');

            if(successfulRecords.length === this.records.length) {
                Rally.ui.notify.Notifier.show({
                    message: message + '.'
                });
            } else {
                if (ineligibleUsers){
                    message = message + ".<br/><br/>" + ineligibleUsers + " user(s) were not updated becuase they were either disabled, Subscription Administrators or Workspace Administrators";
                }

                if (unsuccessfulRecords.length > 0){
                    message = message + ".<br/><br/>" + unsuccessfulRecords.length + " failed with error: <br/> " + errorMessage;
                    Rally.ui.notify.Notifier.showWarning({
                        allowHTML: true,
                        message: message
                    });
                } else {
                    Rally.ui.notify.Notifier.show({
                        allowHTML: true,
                        message: message
                    });
                }
            }

            Ext.callback(this.onActionComplete, null, [successfulRecords, unsuccessfulRecords]);
        }
    }
});