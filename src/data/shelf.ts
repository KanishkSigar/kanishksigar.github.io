// The shelf. Two lists. The unread one is meant to be the longer.
// A note next to a book is optional; a synopsis never belongs here.

export interface Book {
  title: string;
  author: string;
  note?: string;
}

// Books Kanishk has read - seeded from the writing. Add and reorder freely.
export const read: Book[] = [
  { title: 'Notes from Underground', author: 'Dostoevsky', note: 'the only writer angry that understanding yourself changes nothing.' },
  { title: 'White Nights', author: 'Dostoevsky', note: 'a man grateful for four days because he had nothing to compare them to.' },
  { title: 'Crime and Punishment', author: 'Dostoevsky' },
  { title: 'The Idiot', author: 'Dostoevsky' },
  { title: 'The Metamorphosis', author: 'Kafka', note: 'the horror was never the insect.' },
  { title: 'A Hunger Artist', author: 'Kafka' },
  { title: 'Normal People', author: 'Sally Rooney', note: 'telling each other everything is not the same as being known.' },
  { title: 'The Myth of Sisyphus', author: 'Camus', note: 'imagine it. it is an instruction, and it is work.' },
];

// The unread shelf - the list of the men i intended to become.
// PENDING: Kanishk's list goes here.
export const unread: Book[] = [];
