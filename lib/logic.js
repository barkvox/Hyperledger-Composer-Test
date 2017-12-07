/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * A Member grants access to their record to another Member.
 * @param {regit.transactions.AuthorizeAccess} authorize - the authorize to be processed
 * @transaction
 */
function authorizeAccess(authorize) {

    var me = getCurrentParticipant();
    console.log('**** AUTH: ' + me.getIdentifier() + ' granting access to ' + authorize.memberId );

    if(!me) {
        throw new Error('A participant/certificate mapping does not exist.');
    }

    // if the member is not already authorized, we authorize them
    var index = -1;

    if(!me.authorized) {
        me.authorized = [];
    }
    else {
        index = me.authorized.indexOf(authorize.memberId);
    }

    if(index < 0) {
        me.authorized.push(authorize.memberId);

        return getParticipantRegistry('regit.transactions.Member')
        .then(function (memberRegistry) {

            // emit an event
            var event = getFactory().newEvent('regit.transactions', 'MemberEvent');
            event.memberTransaction = authorize;
            emit(event);

            // persist the state of the member
            return memberRegistry.update(me);
        });
    }
}

/**
 * A Member revokes access to their record from another Member.
 * @param {regit.transactions.RevokeAccess} revoke - the RevokeAccess to be processed
 * @transaction
 */
function revokeAccess(revoke) {

    var me = getCurrentParticipant();
    console.log('**** REVOKE: ' + me.getIdentifier() + ' revoking access to ' + revoke.memberId );

    if(!me) {
        throw new Error('A participant/certificate mapping does not exist.');
    }

    // if the member is authorized, we remove them
    var index = me.authorized ? me.authorized.indexOf(revoke.memberId) : -1;

    if(index>-1) {
        me.authorized.splice(index, 1);

        return getParticipantRegistry('regit.transactions.Member')
        .then(function (memberRegistry) {

            // emit an event
            var event = getFactory().newEvent('regit.transactions', 'MemberEvent');
            event.memberTransaction = revoke;
            emit(event);

            // persist the state of the member
            return memberRegistry.update(me);
        });
    }
}

/**
 * Track the trade of a information from one trader to another
 * @param {regit.transactions.AcceptRequest} acceptRequest - the trade to be processed
 * @transaction
 */
function acceptTheRequest(acceptRequest) {
    
        // set the new owner of the information
        acceptRequest.request.state = 'Done';
  		
        return getAssetRegistry('regit.transactions.Request')
            .then(function (requestAssetRegistry) {
    
              
          return getAssetRegistry('regit.transactions.SharedInformation')
                            .then(function (sharedInformationAssetRegistry) {
                              // Get the factory for creating new asset instances.
                            var factory = getFactory();
                             
            				var rightNow = new Date();							
                            var sharedInfo = factory.newResource('regit.transactions', 'SharedInformation', rightNow.toISOString() );
                            sharedInfo.sharedValue = acceptRequest.information[acceptRequest.request.fieldName];
            				sharedInfo.owner = acceptRequest.information.owner;
            				sharedInfo.viewer = acceptRequest.request.creator;
            				sharedInfo.id=acceptRequest.information.id;
                              // Add the vehicle to the vehicle asset registry.
                              return sharedInformationAssetRegistry.add(sharedInfo);
                            })
                           
            return requestAssetRegistry.update(acceptRequest.request)
            });
    }
    