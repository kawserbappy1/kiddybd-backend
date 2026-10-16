import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

const DEMO_ARTICLES = [
  {
    title: "৫টি মজার শিক্ষণীয় খেলা যা ঘরে বসেই শিশুদের মেধা বিকাশ করে",
    slug: "5-fun-learning-activities-for-kids-at-home",
    category: "Early Learning",
    readTime: "4 min read",
    author: "Dr. Sumaiya Farhana (Child Psychologist)",
    image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80",
    summary: "স্ক্রিন টাইম কমিয়ে বাস্তব খেলনা ও অ্যাক্টিভিটি দিয়ে কীভাবে সন্তানের কল্পনাশক্তি ও শব্দভান্ডার বাড়ানো যায় তার কার্যকারী কৌশল।",
    content: `বর্তমানে ছোট বাচ্চাদের স্ক্রিন আসক্তি একটি বড় চিন্তার বিষয়। তবে সঠিক ট্যাকটাইল বা স্পর্শভিত্তিক খেলাধুলার মাধ্যমে সহজেই শিশুদের আগ্রহ ফিরিয়ে আনা সম্ভব।

১. কালার ম্যাচিং ও শেপ সর্টিং:
রঙিন ব্লক বা শেপ সর্টার শিশুদের ভিজ্যুয়াল মেমোরি ও সমস্যা সমাধানের দক্ষতা বাড়াতে দারুণ সাহায্য করে।

২. মন্টেসরি সেন্সরি প্লে:
বালি, চালের দানা বা নরম ক্লে দিয়ে খেলার সুযোগ দিন। এটি হাতের সূক্ষ্ম পেশি (fine motor skills) মজবুত করতে সাহায্য করে।

৩. গল্প বলা ও রোল প্লে:
পুতুল বা খেলনা চরিত্র নিয়ে শিশুর সাথে গল্প বলুন এবং তাকে প্রশ্ন করুন। এতে দ্রুত শব্দভান্ডার বৃদ্ধি পায়।`,
    isPublished: true,
  },
  {
    title: "শিশুর বয়স অনুযায়ী সঠিক খেলনা নির্বাচনের সহজ গাইডলাইন",
    slug: "how-to-choose-the-perfect-toy-by-age",
    category: "Parenting Guide",
    readTime: "5 min read",
    author: "KiddyBD Child Care Team",
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&auto=format&fit=crop&q=80",
    summary: "কোন বয়সে কোন ধরনের খেলনা শিশুর বুদ্ধিমত্তা ও শারিরীক বিকাশের জন্য সবচেয়ে নিরাপদ ও উপযোগী তা জেনে নিন।",
    content: `শিশুর জন্য খেলনা কেনার সময় কেবল দাম বা বাহ্যিক সৌন্দর্য নয়, তার বয়সের ধাপ ও নিরাপত্তার বিষয়টি সবচেয়ে গুরুত্বপূর্ণ।

০ থেকে ১ বছর:
এই বয়সে শিশুর দৃষ্টি ও শ্রবণ ইন্দ্রিয় সজাগ হতে শুরু করে। তাই নরম রেটল, সফট প্লাশ টয় এবং হাই-কনট্রাস্ট কার্ড সেরা।

১ থেকে ৩ বছর:
হাঁটাচলা শেখার বয়স। পুশ অ্যান্ড পুল টয়, বিল্ডিং কিউব এবং কাঠের পাজল শিশুর ভারসাম্য ও মনোযোগ বাড়ায়।

৪ থেকে ৭+ বছর:
STEM রোবোটিক্স, সায়েন্স কিট এবং বোর্ড গেম এই বয়সের ছেলে-মেয়েদের যুক্তিবাদী চিন্তা করতে উৎসাহিত করে।`,
    isPublished: true,
  },
  {
    title: "নবজাতক ও শিশুর জন্য নিরাপদ এবং প্রশান্তিময় নার্সারি তৈরির টিপস",
    slug: "creating-safe-and-happy-nursery-space",
    category: "Baby Care",
    readTime: "3 min read",
    author: "Architect Raisa Ahmed",
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=80",
    summary: "নন-টক্সিক ফিনিশ, সফট লাইটিং ও কর্নার প্রটেকশন দিয়ে ঘরের ভেতরের পরিবেশকে শিশুর জন্য সুরক্ষিত রাখার উপায়।",
    content: `শিশুর ঘুমের ঘর বা নার্সারি কেবল সুন্দর হলেই হবে না, সেখানে স্বাস্থ্যকর বায়ু চলাচলের ব্যবস্থা এবং নিরাপদ ফার্নিচার অত্যন্ত জরুরি।

- তীক্ষ্ণ কর্নার এড়িয়ে চলুন: টেবিল ও খাটের ধারালো কোনায় সিলিকন বা রাবার এজ গার্ড ব্যবহার করুন।
- সফট ওয়ার্ম লাইটিং: রাতের বেলা তীব্র সাদা আলো না দিয়ে ডিমার লাইট বা নাইট ল্যাম্প ব্যবহার করুন।
- নন-টক্সিক উপকরণ: খেলনা ও মেঝের ম্যাট যেন সম্পূর্ণ বিপিএ-ফ্রি এবং শিশু-বান্ধব সার্টিফাইড হয়।`,
    isPublished: true,
  },
  {
    title: "আউটডোর ও মুক্ত বাতাসের খেলাধুলা শিশুর স্বাস্থ্যের জন্য কেন জরুরি?",
    slug: "outdoor-play-benefits-healthy-growth",
    category: "Health & Active",
    readTime: "6 min read",
    author: "Zubayer Hossain (Fitness & Wellness)",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
    summary: "রোদে দৌড়াদৌড়ি, সাইক্লিং ও প্রাকৃতিক পরিবেশে সময় কাটানো শিশুর রোগপ্রতিরোধ ক্ষমতা বৃদ্ধি করে বহুগুণ।",
    content: `গবেষণায় দেখা গেছে, যেসব শিশু নিয়মিত দিনে অন্তত ৪৫ মিনিট খোলা মাঠে বা পার্কে খেলে, তাদের দৃষ্টিশক্তি ও মানসিক স্বাস্থ্য অনেক উন্নত থাকে।

১. ভিটামিন ডি ও হাড়ের পুষ্টি:
সকালের হালকা রোদে প্রাকৃতিক ভিটামিন ডি শিশুর হাড় মজবুত করে এবং রোগপ্রতিরোধ ক্ষমতা বাড়ায়।

২. সামাজিক মেলামেশা:
অন্যান্য বাচ্চাদের সাথে সমবেত খেলাধুলা দলের প্রতি দায়িত্ববোধ ও সহমর্মিতা শেখায়।`,
    isPublished: true,
  },
  {
    title: "মন্টেসরি শিক্ষার ম্যাজিক: কীভাবে শিশুকে স্বাবলম্বী করে তুলবেন",
    slug: "montessori-magic-raising-independent-kids",
    category: "Montessori",
    readTime: "4 min read",
    author: "Muntaha Karim (Montessori Educator)",
    image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=80",
    summary: "খেলনা গোছানো থেকে শুরু করে নিজের কাজ নিজে করার আনন্দ শিশুর আত্মবিশ্বাস গড়ে তোলে শৈশব থেকেই।",
    content: `মন্টেসরি পদ্ধতির মূল মন্ত্র হলো: শিশুকে এমন পরিবেশ দেওয়া যাতে সে নিজের চেষ্টায় শিখতে পারে এবং আত্মনির্ভরশীল হয়ে ওঠে।

- লো-শেলফ ব্যবস্থা: শিশুর খেলনা ও বই এমন উচ্চতায় রাখুন যাতে সে নিজেই বেছে নিতে পারে এবং খেলা শেষে রেখে দিতে পারে।
- বাস্তব অভিজ্ঞতায় অংশগ্রহণ: গাছে পানি দেওয়া, হালকা ফল ধোয়া বা কাপড়ে ক্লিপ লাগানোর কাজে শিশুকে যুক্ত করুন।`,
    isPublished: true,
  },
];

async function seedArticles() {
  console.log("Seeding 5 demo articles...");
  for (const article of DEMO_ARTICLES) {
    const existing = await prisma.article.findUnique({
      where: { slug: article.slug },
    });
    if (!existing) {
      await prisma.article.create({
        data: article,
      });
      console.log(`Created: ${article.title}`);
    } else {
      console.log(`Already exists: ${article.title}`);
    }
  }
  console.log("Seeding completed successfully!");
}

seedArticles()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
