const { PrismaClient } = require('../src/generated/prisma/client');

const prisma = new PrismaClient();

// Standard category names that should exist
const STANDARD_CATEGORIES = [
  "Documentation",
  "Application Process", 
  "Financial",
  "Visa & Immigration",
  "Travel & Accommodation",
  "Pre-Departure",
  "Post-Arrival"
];

async function cleanupDuplicateCategories() {
  console.log("🧹 Starting cleanup of duplicate todo categories...");

  try {
    // Get the first consultancy
    let consultancy = await prisma.consultancy.findFirst();
    
    if (!consultancy) {
      console.log("⚠️ No consultancy found. Please create a consultancy first.");
      return;
    }

    console.log(`📋 Using consultancy: ${consultancy.name}`);

    // Get all categories for this consultancy
    const allCategories = await prisma.todoCategory.findMany({
      where: {
        consultancyId: consultancy.id
      },
      include: {
        _count: {
          select: {
            todos: true,
            templates: true
          }
        }
      }
    });

    console.log(`📊 Found ${allCategories.length} total categories`);

    // Group categories by name
    const categoriesByName = allCategories.reduce((groups, category) => {
      if (!groups[category.name]) {
        groups[category.name] = [];
      }
      groups[category.name].push(category);
      return groups;
    }, {});

    // Process each category name group
    for (const [categoryName, categories] of Object.entries(categoriesByName)) {
      console.log(`\n🔍 Processing category: "${categoryName}" (${categories.length} duplicates)`);
      
      if (categories.length === 1) {
        console.log(`✅ Only one instance of "${categoryName}" - keeping it`);
        continue;
      }

      // Sort by creation date to keep the oldest one
      categories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Keep the first (oldest) category, delete the rest
      const [keepCategory, ...deleteCategories] = categories;
      
      console.log(`📌 Keeping: ${keepCategory.id} (created ${keepCategory.createdAt})`);
      console.log(`🗑️  Deleting: ${deleteCategories.map(c => `${c.id} (${c._count.todos} todos, ${c._count.templates} templates)`).join(', ')}`);

      // Update todos and templates to point to the kept category before deleting duplicates
      for (const deleteCategory of deleteCategories) {
        // Update todos
        if (deleteCategory._count.todos > 0) {
          await prisma.studentTodo.updateMany({
            where: {
              categoryId: deleteCategory.id
            },
            data: {
              categoryId: keepCategory.id
            }
          });
          console.log(`   📝 Updated ${deleteCategory._count.todos} todos to point to kept category`);
        }

        // Update templates
        if (deleteCategory._count.templates > 0) {
          await prisma.todoTemplate.updateMany({
            where: {
              categoryId: deleteCategory.id
            },
            data: {
              categoryId: keepCategory.id
            }
          });
          console.log(`   📋 Updated ${deleteCategory._count.templates} templates to point to kept category`);
        }

        // Delete the duplicate category
        await prisma.todoCategory.delete({
          where: {
            id: deleteCategory.id
          }
        });
        console.log(`   🗑️  Deleted category ${deleteCategory.id}`);
      }
    }

    // Now handle non-standard category names
    console.log(`\n🔍 Checking for non-standard category names...`);
    
    const nonStandardCategories = allCategories.filter(
      category => !STANDARD_CATEGORIES.includes(category.name)
    );

    if (nonStandardCategories.length > 0) {
      console.log(`⚠️ Found ${nonStandardCategories.length} non-standard categories:`);
      nonStandardCategories.forEach(category => {
        console.log(`   - "${category.name}" (${category._count.todos} todos, ${category._count.templates} templates)`);
      });

      // For now, let's just report them. In a real cleanup, you might want to:
      // 1. Map them to standard categories
      // 2. Or ask the user what to do with them
      console.log(`\n💡 Consider whether these categories should be:`);
      console.log(`   1. Mapped to standard categories`);
      console.log(`   2. Kept as custom categories`);
      console.log(`   3. Deleted (if unused)`);
    }

    // Final count
    const finalCategories = await prisma.todoCategory.count({
      where: {
        consultancyId: consultancy.id
      }
    });

    console.log(`\n🎉 Cleanup completed!`);
    console.log(`📊 Final category count: ${finalCategories}`);

    // Show final categories
    const finalCategoryList = await prisma.todoCategory.findMany({
      where: {
        consultancyId: consultancy.id
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        name: true,
        _count: {
          select: {
            todos: true,
            templates: true
          }
        }
      }
    });

    console.log(`\n📋 Final categories:`);
    finalCategoryList.forEach(category => {
      console.log(`   - "${category.name}" (${category._count.todos} todos, ${category._count.templates} templates)`);
    });

  } catch (error) {
    console.error("❌ Error cleaning up categories:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup function
cleanupDuplicateCategories()
  .then(() => {
    console.log("✨ Cleanup completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Cleanup failed:", error);
    process.exit(1);
  });
