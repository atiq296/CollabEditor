import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import './RoleHierarchy.css';

const RoleHierarchy = () => {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    role: '',
    department: '',
    position: '',
    committee: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role || '',
      department: user.department || '',
      position: user.position || '',
      committee: user.committee || ''
    });
    setOpenDialog(true);
  };

  const handleSaveUser = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        setOpenDialog(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const getUsersByRole = (role) => {
    return users.filter(user => user.role === role);
  };

  const getCommitteeUsers = (committee) => {
    return users.filter(user => user.committee === committee);
  };

  const getDepartmentUsers = (committee, department) => {
    return users.filter(user => 
      user.committee === committee && 
      user.department === department
    );
  };

  return (
    <Box className="role-hierarchy-container">
      <Typography variant="h4" gutterBottom>
        Role Hierarchy
      </Typography>

      <Grid container spacing={3}>
        {/* Students */}
        <Grid item xs={12} md={6} lg={4}>
          <Card className="role-card students">
            <CardContent>
              <Typography variant="h6" color="primary">
                Students
              </Typography>
              {getUsersByRole('Student').map(user => (
                <Chip 
                  key={user._id} 
                  label={user.name} 
                  onClick={() => handleEditUser(user)}
                  className="user-chip"
                />
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Supervisors */}
        <Grid item xs={12} md={6} lg={4}>
          <Card className="role-card supervisors">
            <CardContent>
              <Typography variant="h6" color="primary">
                Supervisors
              </Typography>
              {getUsersByRole('Supervisor').map(user => (
                <Chip 
                  key={user._id} 
                  label={user.name} 
                  onClick={() => handleEditUser(user)}
                  className="user-chip"
                />
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* UGPC */}
        <Grid item xs={12} md={6} lg={4}>
          <Card className="role-card ugpc">
            <CardContent>
              <Typography variant="h6" color="primary">
                UGPC (Undergraduate Program Committee)
              </Typography>
              
              {/* CS Department */}
              <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                CS (Computer Science)
              </Typography>
              {getDepartmentUsers('UGPC', 'CS').map(user => (
                <Chip 
                  key={user._id} 
                  label={`${user.name} (${user.position})`}
                  onClick={() => handleEditUser(user)}
                  className="user-chip"
                  color={user.position === 'Head' ? 'secondary' : 'default'}
                />
              ))}

              {/* SE Department */}
              <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                SE (Software Engineering)
              </Typography>
              {getDepartmentUsers('UGPC', 'SE').map(user => (
                <Chip 
                  key={user._id} 
                  label={`${user.name} (${user.position})`}
                  onClick={() => handleEditUser(user)}
                  className="user-chip"
                  color={user.position === 'Head' ? 'secondary' : 'default'}
                />
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* UGEC */}
        <Grid item xs={12} md={6} lg={4}>
          <Card className="role-card ugec">
            <CardContent>
              <Typography variant="h6" color="primary">
                UGEC (Undergraduate Examination Committee)
              </Typography>
              
              {/* CS Department */}
              <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                CS (Computer Science)
              </Typography>
              {getDepartmentUsers('UGEC', 'CS').map(user => (
                <Chip 
                  key={user._id} 
                  label={`${user.name} (${user.position})`}
                  onClick={() => handleEditUser(user)}
                  className="user-chip"
                  color={user.position === 'Head' ? 'secondary' : 'default'}
                />
              ))}

              {/* SE Department */}
              <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                SE (Software Engineering)
              </Typography>
              {getDepartmentUsers('UGEC', 'SE').map(user => (
                <Chip 
                  key={user._id} 
                  label={`${user.name} (${user.position})`}
                  onClick={() => handleEditUser(user)}
                  className="user-chip"
                  color={user.position === 'Head' ? 'secondary' : 'default'}
                />
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* HOD */}
        <Grid item xs={12} md={6} lg={4}>
          <Card className="role-card hod">
            <CardContent>
              <Typography variant="h6" color="primary">
                HOD (Head of Department)
              </Typography>
              {getUsersByRole('HOD').map(user => (
                <Chip 
                  key={user._id} 
                  label={user.name} 
                  onClick={() => handleEditUser(user)}
                  className="user-chip"
                />
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Admin */}
        <Grid item xs={12} md={6} lg={4}>
          <Card className="role-card admin">
            <CardContent>
              <Typography variant="h6" color="primary">
                Admin
              </Typography>
              {getUsersByRole('Admin').map(user => (
                <Chip 
                  key={user._id} 
                  label={user.name} 
                  onClick={() => handleEditUser(user)}
                  className="user-chip"
                />
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={editForm.role}
              onChange={(e) => setEditForm({...editForm, role: e.target.value})}
              label="Role"
            >
              <MenuItem value="Student">Student</MenuItem>
              <MenuItem value="Supervisor">Supervisor</MenuItem>
              <MenuItem value="UGPC">UGPC</MenuItem>
              <MenuItem value="UGEC">UGEC</MenuItem>
              <MenuItem value="HOD">HOD</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
            </Select>
          </FormControl>

          {(editForm.role === 'UGPC' || editForm.role === 'UGEC') && (
            <>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={editForm.department}
                  onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                  label="Department"
                >
                  <MenuItem value="CS">CS (Computer Science)</MenuItem>
                  <MenuItem value="SE">SE (Software Engineering)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Position</InputLabel>
                <Select
                  value={editForm.position}
                  onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                  label="Position"
                >
                  <MenuItem value="Head">Head</MenuItem>
                  <MenuItem value="Member">Member</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleHierarchy; 