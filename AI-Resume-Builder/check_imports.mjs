import * as Lucide from 'lucide-react';
import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';

console.log('--- Environment Check ---');
console.log('React version:', React.version);

console.log('\n--- Lucide-React Check ---');
const requiredIcons = [
    'Loader2', 'Plus', 'Sparkles', 'X', 'Notebook', 'MoreVertical',
    'Briefcase', 'Users', 'LayoutDashboard', 'LogOut',
    'LayoutGrid', 'Lock', 'ArrowLeft', 'ArrowRight', 'Home'
];
requiredIcons.forEach(icon => {
    console.log(`${icon}: ${Lucide[icon] ? 'Defined' : 'UNDEFINED'}`);
});

console.log('\n--- Radix Dialog Check ---');
console.log('Dialog Root:', RadixDialog.Root ? 'Defined' : 'UNDEFINED');
console.log('Dialog Content:', RadixDialog.Content ? 'Defined' : 'UNDEFINED');

console.log('\n--- Check Complete ---');
