Ext.define('CA.technicalservices.userutilities.bulkmenu.RemovePermissions', {
    alias: 'widget.removepermissionsbulkmenuitem',
    extend: 'Rally.ui.menu.bulk.MenuItem',

    config: {
        onBeforeAction: function(){
//            console.log('onbeforeaction');
        },

        text: 'Remove Permissions...',

        handler: function () {
            var dialog = Ext.create('CA.technicalservices.userutilities.dialog.RemovePermissions',{});
            dialog.on('updated', this.removePermissions, this);
        },
        predicate: function (records) {
            return _.every(records, function (record) {
                return record;
            });
        },
        removePermissions: function(dlg, selectionCache){
            var successfulRecords = this.records,
                unsuccessfulRecords = [];

            var promises = [];
            Ext.Array.each(this.records, function(r){
                var user = r.get('ObjectID');
                Ext.Object.each(selectionCache, function(permissionKey, projects){
                    var permission = "No Access";
                    promises.push(
                        function(){ return CA.technicalservices.userutilities.ProjectUtility.assignPermissions(user, permission,projects, true); });
                });
            });

            var records = this.records;
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

                    this.onActionComplete(successfulRecords, unsuccessfulRecords);
                    if (errorMessages.length > 0){
                        Rally.ui.notify.Notifier.showError({message: errorMessages.join(',')});
                    }
                },
                scope: this
            });


        }
    }
});