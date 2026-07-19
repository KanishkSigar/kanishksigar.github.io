// The shelf. Two lists. The unread one is meant to be the longer.
// A note next to a book is optional; a synopsis never belongs here.

export interface Book {
  title: string;
  author: string;
  note?: string;
}

// Books Kanishk has read.
export const read: Book[] = [
  { title: 'Normal People', author: 'Sally Rooney', note: 'telling each other everything is not the same as being known.' },
  { title: 'Conversations with Friends', author: 'Sally Rooney' },
  { title: 'White Nights', author: 'Dostoevsky', note: 'a man grateful for four days because he had nothing to compare them to.' },
  { title: 'The Metamorphosis', author: 'Kafka', note: 'the horror was never the insect.' },
  { title: 'Letters to Milena', author: 'Kafka' },
  { title: 'The Raven', author: 'Edgar Allan Poe' },
  { title: 'The Catcher in the Rye', author: 'J.D. Salinger' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
  { title: 'Pride and Prejudice', author: 'Jane Austen' },
  { title: 'Wuthering Heights', author: 'Emily Brontë' },
  { title: 'The Importance of Being Earnest', author: 'Oscar Wilde' },
  { title: 'The Fault in Our Stars', author: 'John Green' },
  { title: 'Chemical Hearts', author: 'Krystal Sutherland' },
  { title: 'Thirteen Reasons Why', author: 'Jay Asher' },
  { title: 'Fool Me Twice', author: 'Nona Uppal' },
  { title: 'Origin', author: 'Dan Brown' },
  { title: 'The Archer', author: 'Paulo Coelho' },
  { title: 'Harry Potter', author: 'J.K. Rowling', note: 'the whole series.' },
  { title: 'Meditations', author: 'Marcus Aurelius' },
  { title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson' },
  { title: 'The Stories of Rumi', author: 'Rumi' },
  { title: 'Rashmirathi', author: 'Ramdhari Singh Dinkar' },
  { title: 'Godaan', author: 'Premchand' },
];

// The unread shelf - the list of the men i intended to become.
// Some of these are ongoing.
export const unread: Book[] = [
  { title: 'The Brothers Karamazov', author: 'Dostoevsky' },
  { title: 'Crime and Punishment', author: 'Dostoevsky' },
  { title: 'A Little Life', author: 'Hanya Yanagihara' },
  { title: 'Intermezzo', author: 'Sally Rooney' },
  { title: 'Frankenstein', author: 'Mary Shelley' },
  { title: '1984', author: 'George Orwell' },
  { title: 'Animal Farm', author: 'George Orwell' },
  { title: 'The Alchemist', author: 'Paulo Coelho' },
  { title: 'Sense and Sensibility', author: 'Jane Austen' },
  { title: 'The Art of War', author: 'Sun Tzu' },
  { title: 'Old Roads, New Roads', author: 'Ruskin Bond' },
];
