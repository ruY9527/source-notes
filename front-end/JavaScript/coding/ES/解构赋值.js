const people = [
    {
    name: 'Mike Smith',
    family: {
      mother: 'Jane Smith',
      father: 'Harry Smith',
      sister: 'Samantha Smith',
    },
    age: 35,
  },
  {
    name: 'Tom Jones',
    family: {
      mother: 'Norah Jones',
      father: 'Richard Jones',
      brother: 'Howard Jones',
    },
    age: 25,
  }
];
for( const {name:x,family:{mother:y,father:z},age:age} of people){
    console.log(x,'name')
    console.log(y,'mother')
    console.log(z,'father')
}