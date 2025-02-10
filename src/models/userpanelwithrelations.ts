
import UserPanel from './userpanel';
import Client from './client';
import Roles from './roles';

export default interface UserPanelWithRelations extends UserPanel {
    UserClientRoles?: Array<{
      Client: Client;
      Roles: Roles;
    }>;
  }